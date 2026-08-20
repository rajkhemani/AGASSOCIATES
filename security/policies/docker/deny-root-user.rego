# Docker Custom Policies for AGASSOCIATES
# Place in: security/policies/docker/

package docker

# =============================================================================
# DENY ROOT USER
# =============================================================================

deny[msg] {
    input.User == "root"
    msg := "Container runs as root user. Set USER to a non-root user."
}

deny[msg] {
    input.User == "0"
    msg := "Container runs as UID 0 (root). Set USER to a non-root user."
}

deny[msg] {
    not input.User
    msg := "Container does not specify USER. Defaults to root. Set USER to a non-root user."
}

# =============================================================================
# REQUIRE HEALTHCHECK
# =============================================================================

deny[msg] {
    not input.Healthcheck
    msg := "Image does not have a HEALTHCHECK. Add HEALTHCHECK for container health monitoring."
}

deny[msg] {
    input.Healthcheck
    not input.Healthcheck.Test
    msg := "HEALTHCHECK defined but missing Test command."
}

# =============================================================================
# DENY EXPOSED HIGH PORTS
# =============================================================================

deny[msg] {
    port := input.ExposedPorts[_]
    port_number := parse_port(port)
    port_number > 1024
    port_number < 32768
    not allowed_port(port_number)
    msg := sprintf("Port %d exposed. Only expose necessary ports. Common ports: 80, 443, 3000, 8000, 8080, 5432, 6379.", [port_number])
}

allowed_port(port) {
    port == 80
    port == 443
    port == 3000
    port == 3001
    port == 5000
    port == 8000
    port == 8001
    port == 8080
    port == 8443
    port == 5432
    port == 5433
    port == 6379
    port == 6380
    port == 5678
    port == 5679
    port == 9090
    port == 9100
}

parse_port(port) = port_number {
    parts := split(port, "/")
    port_number := parts[0]
}

# =============================================================================
# REQUIRE LABELS
# =============================================================================

required_labels := {
    "org.opencontainers.image.title",
    "org.opencontainers.image.version",
    "org.opencontainers.image.source",
    "org.opencontainers.image.licenses",
    "agassociates.service",
    "agassociates.environment"
}

deny[msg] {
    label := required_labels[_]
    not input.Labels[label]
    msg := sprintf("Missing required label: %s", [label])
}

# =============================================================================
# DENY PRIVILEGED MODE IN DOCKERFILE
# =============================================================================

deny[msg] {
    instruction := input.Instructions[_]
    instruction.Value == "--privileged"
    msg := "Dockerfile uses --privileged flag. Avoid privileged mode."
}

# =============================================================================
# REQUIRE SPECIFIC BASE IMAGES
# =============================================================================

allowed_base_images := {
    "python:3.11-slim",
    "python:3.12-slim",
    "node:20-alpine",
    "node:22-alpine",
    "golang:1.22-alpine",
    "golang:1.23-alpine",
    "nginx:alpine",
    "redis:7-alpine",
    "postgres:16-alpine",
    "caddy:2-alpine",
}

deny[msg] {
    instruction := input.Instructions[_]
    instruction.Key == "FROM"
    base_image := split(instruction.Value, " ")[0]
    not base_image in allowed_base_images
    not is_allowed_custom_base(base_image)
    msg := sprintf("Base image '%s' not in allowed list. Use approved base images only.", [base_image])
}

is_allowed_custom_base(image) {
    startswith(image, "ghcr.io/rajkhemani/")
}

# =============================================================================
# DENY ADD/COPY WITHOUT CHOWN
# =============================================================================

deny[msg] {
    instruction := input.Instructions[_]
    instruction.Key == "COPY"
    not contains(instruction.Flags, "--chown")
    not is_safe_copy_destination(instruction.Value)
    msg := sprintf("COPY instruction should use --chown to set ownership: %s", [instruction.Value])
}

deny[msg] {
    instruction := input.Instructions[_]
    instruction.Key == "ADD"
    not contains(instruction.Flags, "--chown")
    not is_safe_copy_destination(instruction.Value)
    msg := sprintf("ADD instruction should use --chown to set ownership: %s", [instruction.Value])
}

is_safe_copy_destination(value) {
    dest := split(value, " ")[-1]
    startswith(dest, "/tmp")
    startswith(dest, "/var/tmp")
    startswith(dest, "/build")
}

# =============================================================================
# REQUIRE NON-ROOT USER CREATION
# =============================================================================

deny[msg] {
    user_created := false
    instruction := input.Instructions[_]
    instruction.Key == "RUN"
    contains(instruction.Value, "useradd")
    user_created := true
    
    user_set := false
    instruction2 := input.Instructions[_]
    instruction2.Key == "USER"
    user_set := true
    
    user_created
    not user_set
    msg := "Non-root user created but USER instruction not found. Ensure USER is set after user creation."
}

# =============================================================================
# DENY SECRETS IN IMAGE
# =============================================================================

secret_patterns := [
    "password",
    "secret",
    "token",
    "key",
    "api_key",
    "apikey",
    "access_key",
    "private_key",
    "ssh_key",
    "cert",
    "pem",
    "p12",
    "pfx"
]

deny[msg] {
    instruction := input.Instructions[_]
    instruction.Key == "ENV"
    env_value := instruction.Value
    pattern := secret_patterns[_]
    contains(lower(env_value), pattern)
    msg := sprintf("Possible secret in ENV instruction: %s", [instruction.Value])
}

deny[msg] {
    instruction := input.Instructions[_]
    instruction.Key == "ARG"
    arg_value := instruction.Value
    pattern := secret_patterns[_]
    contains(lower(arg_value), pattern)
    msg := sprintf("Possible secret in ARG instruction: %s", [instruction.Value])
}

# =============================================================================
# MULTI-STAGE BUILD CHECK
# =============================================================================

deny[msg] {
    from_count := 0
    instruction := input.Instructions[_]
    instruction.Key == "FROM"
    from_count := from_count + 1
    from_count == 1
    instruction2 := input.Instructions[_]
    instruction2.Key == "RUN"
    contains(lower(instruction2.Value), "apt-get install")
    contains(lower(instruction2.Value), "build-essential")
    msg := "Single-stage build with build tools detected. Use multi-stage build to reduce image size and attack surface."
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

contains(haystack, needle) {
    regex := sprintf(".*%s.*", [needle])
    re_match(regex, haystack)
}

startswith(str, prefix) {
    substr(str, 0, count(prefix)) == prefix
}

lower(str) = lower_str {
    lower_map := {
        "A": "a", "B": "b", "C": "c", "D": "d", "E": "e", "F": "f",
        "G": "g", "H": "h", "I": "i", "J": "j", "K": "k", "L": "l",
        "M": "m", "N": "n", "O": "o", "P": "p", "Q": "q", "R": "r",
        "S": "s", "T": "t", "U": "u", "V": "v", "W": "w", "X": "x",
        "Y": "y", "Z": "z"
    }
    # Simplified - use regex in practice
    lower_str := str
}