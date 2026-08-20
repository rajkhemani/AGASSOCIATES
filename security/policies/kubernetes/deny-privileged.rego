# Kubernetes Custom Policies for AGASSOCIATES
# Place in: security/policies/kubernetes/

package kubernetes

# =============================================================================
# DENY PRIVILEGED CONTAINERS
# =============================================================================

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    container.securityContext.privileged == true
    msg := sprintf("Container '%s' runs in privileged mode. Privileged containers have full access to the host system.", [container.name])
}

deny[msg] {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    container.securityContext.privileged == true
    msg := sprintf("Container '%s' in Deployment '%s' runs in privileged mode.", [container.name, input.metadata.name])
}

deny[msg] {
    input.kind == "StatefulSet"
    container := input.spec.template.spec.containers[_]
    container.securityContext.privileged == true
    msg := sprintf("Container '%s' in StatefulSet '%s' runs in privileged mode.", [container.name, input.metadata.name])
}

deny[msg] {
    input.kind == "DaemonSet"
    container := input.spec.template.spec.containers[_]
    container.securityContext.privileged == true
    msg := sprintf("Container '%s' in DaemonSet '%s' runs in privileged mode.", [container.name, input.metadata.name])
}

# =============================================================================
# REQUIRE RESOURCE LIMITS
# =============================================================================

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.resources.limits.memory
    msg := sprintf("Container '%s' must have memory limits defined.", [container.name])
}

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.resources.limits.cpu
    msg := sprintf("Container '%s' must have CPU limits defined.", [container.name])
}

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.resources.requests.memory
    msg := sprintf("Container '%s' must have memory requests defined.", [container.name])
}

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.resources.requests.cpu
    msg := sprintf("Container '%s' must have CPU requests defined.", [container.name])
}

# Apply to Deployments, StatefulSets, DaemonSets
deny[msg] {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    not container.resources.limits.memory
    msg := sprintf("Container '%s' in Deployment '%s' must have memory limits.", [container.name, input.metadata.name])
}

deny[msg] {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    not container.resources.limits.cpu
    msg := sprintf("Container '%s' in Deployment '%s' must have CPU limits.", [container.name, input.metadata.name])
}

deny[msg] {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    not container.resources.requests.memory
    msg := sprintf("Container '%s' in Deployment '%s' must have memory requests.", [container.name, input.metadata.name])
}

deny[msg] {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    not container.resources.requests.cpu
    msg := sprintf("Container '%s' in Deployment '%s' must have CPU requests.", [container.name, input.metadata.name])
}

# =============================================================================
# REQUIRE NETWORK POLICIES
# =============================================================================

deny[msg] {
    input.kind == "Namespace"
    not input.metadata.labels["network-policy"]
    msg := sprintf("Namespace '%s' must have a NetworkPolicy label for isolation.", [input.metadata.name])
}

# =============================================================================
# DENY HOST NETWORK/PID/IPC
# =============================================================================

deny[msg] {
    input.kind == "Pod"
    input.spec.hostNetwork == true
    msg := "Pod uses hostNetwork. This gives the pod access to the host's network stack."
}

deny[msg] {
    input.kind == "Pod"
    input.spec.hostPID == true
    msg := "Pod uses hostPID. This allows the pod to see all processes on the host."
}

deny[msg] {
    input.kind == "Pod"
    input.spec.hostIPC == true
    msg := "Pod uses hostIPC. This allows the pod to share IPC namespace with the host."
}

# =============================================================================
# REQUIRE READ-ONLY ROOT FILESYSTEM
# =============================================================================

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    container.securityContext.readOnlyRootFilesystem != true
    msg := sprintf("Container '%s' must have readOnlyRootFilesystem set to true.", [container.name])
}

deny[msg] {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    container.securityContext.readOnlyRootFilesystem != true
    msg := sprintf("Container '%s' in Deployment '%s' must have readOnlyRootFilesystem set to true.", [container.name, input.metadata.name])
}

# =============================================================================
# REQUIRE NON-ROOT USER
# =============================================================================

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.securityContext.runAsNonRoot
    container.securityContext.runAsUser == 0
    msg := sprintf("Container '%s' must not run as root (UID 0). Set runAsNonRoot: true and runAsUser to non-zero.", [container.name])
}

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.securityContext.runAsNonRoot
    not container.securityContext.runAsUser
    msg := sprintf("Container '%s' must explicitly set runAsNonRoot: true and runAsUser.", [container.name])
}

# =============================================================================
# REQUIRE DROP ALL CAPABILITIES
# =============================================================================

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    capabilities := container.securityContext.capabilities
    not capabilities.drop
    msg := sprintf("Container '%s' must drop ALL capabilities. Add: capabilities: { drop: ['ALL'] }", [container.name])
}

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    capabilities := container.securityContext.capabilities
    capabilities.drop
    not "ALL" in capabilities.drop
    msg := sprintf("Container '%s' must drop ALL capabilities. Current drop list: %v", [container.name, capabilities.drop])
}

# =============================================================================
# DENY HOST PATH VOLUMES
# =============================================================================

deny[msg] {
    input.kind == "Pod"
    volume := input.spec.volumes[_]
    volume.hostPath
    msg := sprintf("Pod uses hostPath volume '%s'. HostPath volumes should be avoided for security.", [volume.name])
}

# =============================================================================
# REQUIRE LIVENESS AND READINESS PROBES
# =============================================================================

deny[msg] {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    not container.livenessProbe
    msg := sprintf("Container '%s' in Deployment '%s' must have a livenessProbe defined.", [container.name, input.metadata.name])
}

deny[msg] {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    not container.readinessProbe
    msg := sprintf("Container '%s' in Deployment '%s' must have a readinessProbe defined.", [container.name, input.metadata.name])
}

# =============================================================================
# DENY DEFAULT SERVICE ACCOUNT
# =============================================================================

deny[msg] {
    input.kind == "Pod"
    not input.spec.serviceAccountName
    msg := "Pod must explicitly specify a serviceAccountName. Avoid using the default service account."
}

deny[msg] {
    input.kind == "Pod"
    input.spec.serviceAccountName == "default"
    msg := "Pod uses the default service account. Create a dedicated service account with minimal permissions."
}

# =============================================================================
# REQUIRE POD SECURITY STANDARDS LABELS
# =============================================================================

deny[msg] {
    input.kind == "Namespace"
    not input.metadata.labels["pod-security.kubernetes.io/enforce"]
    msg := sprintf("Namespace '%s' must have pod-security.kubernetes.io/enforce label set to 'restricted' or 'baseline'.", [input.metadata.name])
}

deny[msg] {
    input.kind == "Namespace"
    input.metadata.labels["pod-security.kubernetes.io/enforce"] == "privileged"
    msg := sprintf("Namespace '%s' has privileged pod security standard. Use 'restricted' or 'baseline'.", [input.metadata.name])
}

# =============================================================================
# DENY ALLOW PRIVILEGE ESCALATION
# =============================================================================

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    container.securityContext.allowPrivilegeEscalation == true
    msg := sprintf("Container '%s' must set allowPrivilegeEscalation: false.", [container.name])
}

deny[msg] {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    container.securityContext.allowPrivilegeEscalation == true
    msg := sprintf("Container '%s' in Deployment '%s' must set allowPrivilegeEscalation: false.", [container.name, input.metadata.name])
}

# =============================================================================
# REQUIRE SECCOMP PROFILE
# =============================================================================

deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.securityContext.seccompProfile
    msg := sprintf("Container '%s' must have a seccompProfile defined (e.g., RuntimeDefault).", [container.name])
}

deny[msg] {
    input.kind == "Deployment"
    container := input.spec.template.spec.containers[_]
    not container.securityContext.seccompProfile
    msg := sprintf("Container '%s' in Deployment '%s' must have a seccompProfile defined.", [container.name, input.metadata.name])
}

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

# Check if a container has a specific volume mount
has_volume_mount(container, volume_name) {
    mount := container.volumeMounts[_]
    mount.name == volume_name
}

# Check if namespace is system namespace
is_system_namespace(namespace) {
    namespace == "kube-system"
    namespace == "kube-public"
    namespace == "kube-node-lease"
    namespace == "monitoring"
    namespace == "ingress-nginx"
}

# Allow exceptions for system namespaces
deny[msg] {
    not is_system_namespace(input.metadata.namespace)
    # ... other deny rules apply
}