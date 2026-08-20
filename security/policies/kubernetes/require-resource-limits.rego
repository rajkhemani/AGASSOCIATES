# Kubernetes Resource Limits Policy for AGASSOCIATES
# Ensures all containers have appropriate resource limits and requests

package kubernetes

# =============================================================================
# MEMORY LIMITS - REASONABLE BOUNDS
# =============================================================================

# Memory limit should not exceed 4GiB for standard workloads
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    limit := container.resources.limits.memory
    limit_parsed := parse_memory(limit)
    limit_parsed > 4294967296  # 4GiB in bytes
    msg := sprintf("Container '%s' memory limit (%s) exceeds maximum allowed (4GiB).", [container.name, limit])
}

# Memory request should not be less than 64MiB
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    request := container.resources.requests.memory
    request_parsed := parse_memory(request)
    request_parsed < 67108864  # 64MiB in bytes
    msg := sprintf("Container '%s' memory request (%s) is below minimum (64MiB).", [container.name, request])
}

# Memory limit should be at least 2x request (to allow bursting)
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    limit := container.resources.limits.memory
    request := container.resources.requests.memory
    limit_parsed := parse_memory(limit)
    request_parsed := parse_memory(request)
    limit_parsed > 0
    request_parsed > 0
    limit_parsed < request_parsed * 2
    msg := sprintf("Container '%s' memory limit (%s) should be at least 2x request (%s).", [container.name, limit, request])
}

# =============================================================================
# CPU LIMITS - REASONABLE BOUNDS
# =============================================================================

# CPU limit should not exceed 4 cores for standard workloads
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    limit := container.resources.limits.cpu
    limit_parsed := parse_cpu(limit)
    limit_parsed > 4000  # 4 cores in millicores
    msg := sprintf("Container '%s' CPU limit (%s) exceeds maximum allowed (4000m).", [container.name, limit])
}

# CPU request should not be less than 50m
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    request := container.resources.requests.cpu
    request_parsed := parse_cpu(request)
    request_parsed < 50  # 50 millicores
    msg := sprintf("Container '%s' CPU request (%s) is below minimum (50m).", [container.name, request])
}

# CPU limit should be at least 2x request
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    limit := container.resources.limits.cpu
    request := container.resources.requests.cpu
    limit_parsed := parse_cpu(limit)
    request_parsed := parse_cpu(request)
    limit_parsed > 0
    request_parsed > 0
    limit_parsed < request_parsed * 2
    msg := sprintf("Container '%s' CPU limit (%s) should be at least 2x request (%s).", [container.name, limit, request])
}

# =============================================================================
# APPLY TO DEPLOYMENTS, STATEFULSETS, DAEMONSETS
# =============================================================================

# Memory checks for Deployments
deny[msg] {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    limit := container.resources.limits.memory
    limit_parsed := parse_memory(limit)
    limit_parsed > 4294967296
    msg := sprintf("Container '%s' in Deployment '%s' memory limit (%s) exceeds maximum (4GiB).", [container.name, input.metadata.name, limit])
}

# CPU checks for Deployments
deny[msg] {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    limit := container.resources.limits.cpu
    limit_parsed := parse_cpu(limit)
    limit_parsed > 4000
    msg := sprintf("Container '%s' in Deployment '%s' CPU limit (%s) exceeds maximum (4000m).", [container.name, input.metadata.name, limit])
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

# Parse memory string (e.g., "512Mi", "1Gi", "1024M") to bytes
parse_memory(value) = bytes {
    # Handle string values
    endswith(value, "Gi")
    {
        gb := replace(value, "Gi", "")
        bytes := gb * 1073741824
    }
    endswith(value, "G")
    {
        gb := replace(value, "G", "")
        bytes := gb * 1000000000
    }
    endswith(value, "Mi")
    {
        mb := replace(value, "Mi", "")
        bytes := mb * 1048576
    }
    endswith(value, "M")
    {
        mb := replace(value, "M", "")
        bytes := mb * 1000000
    }
    endswith(value, "Ki")
    {
        kb := replace(value, "Ki", "")
        bytes := kb * 1024
    }
    endswith(value, "K")
    {
        kb := replace(value, "K", "")
        bytes := kb * 1000
    }
    # Default: assume bytes
    {
        bytes := value
    }
}

# Parse CPU string (e.g., "500m", "1", "2") to millicores
parse_cpu(value) = millicores {
    endswith(value, "m")
    {
        mc := replace(value, "m", "")
        millicores := mc
    }
    # Default: assume cores, convert to millicores
    {
        millicores := value * 1000
    }
}

# =============================================================================
# EXEMPTIONS
# =============================================================================

# Allow higher limits for specific workloads (with label)
allow_high_resources(input) {
    input.metadata.labels["agassociates.io/high-resources"] == "true"
}

# Skip checks for exempted workloads
deny[msg] {
    not allow_high_resources(input)
    # ... other checks apply
}