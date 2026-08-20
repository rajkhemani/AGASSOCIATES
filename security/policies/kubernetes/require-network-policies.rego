# Kubernetes Network Policy Requirements for AGASSOCIATES
# Ensures proper network isolation

package kubernetes

# =============================================================================
# REQUIRE NETWORK POLICIES FOR EACH NAMESPACE
# =============================================================================

# Every namespace (except system) must have at least one NetworkPolicy
deny[msg] {
    input.kind == "Namespace"
    not is_system_namespace(input.metadata.name)
    not has_network_policy(input.metadata.name)
    msg := sprintf("Namespace '%s' must have at least one NetworkPolicy for ingress/egress control.", [input.metadata.name])
}

# =============================================================================
# REQUIRE DEFAULT DENY INGRESS POLICY
# =============================================================================

# Each namespace should have a default deny ingress policy
deny[msg] {
    input.kind == "Namespace"
    not is_system_namespace(input.metadata.name)
    not has_default_deny_ingress(input.metadata.name)
    msg := sprintf("Namespace '%s' must have a default deny ingress NetworkPolicy.", [input.metadata.name])
}

# =============================================================================
# REQUIRE DEFAULT DENY EGRESS POLICY
# =============================================================================

# Each namespace should have a default deny egress policy
deny[msg] {
    input.kind == "Namespace"
    not is_system_namespace(input.metadata.name)
    not has_default_deny_egress(input.metadata.name)
    msg := sprintf("Namespace '%s' must have a default deny egress NetworkPolicy.", [input.metadata.name])
}

# =============================================================================
# NETWORK POLICY SPECIFIC REQUIREMENTS
# =============================================================================

# NetworkPolicy must specify podSelector (not empty)
deny[msg] {
    input.kind == "NetworkPolicy"
    not input.spec.podSelector
    msg := sprintf("NetworkPolicy '%s' must specify a podSelector.", [input.metadata.name])
}

# NetworkPolicy must have policyTypes
deny[msg] {
    input.kind == "NetworkPolicy"
    not input.spec.policyTypes
    msg := sprintf("NetworkPolicy '%s' must specify policyTypes (Ingress, Egress, or both).", [input.metadata.name])
}

# Ingress rules must specify ports
deny[msg] {
    input.kind == "NetworkPolicy"
    rule := input.spec.ingress[_]
    rule.ports
    count(rule.ports) == 0
    msg := sprintf("NetworkPolicy '%s' ingress rule must specify at least one port.", [input.metadata.name])
}

# Egress rules must specify ports
deny[msg] {
    input.kind == "NetworkPolicy"
    rule := input.spec.egress[_]
    rule.ports
    count(rule.ports) == 0
    msg := sprintf("NetworkPolicy '%s' egress rule must specify at least one port.", [input.metadata.name])
}

# Ingress from should not be empty (allow all)
deny[msg] {
    input.kind == "NetworkPolicy"
    rule := input.spec.ingress[_]
    not rule.from
    msg := sprintf("NetworkPolicy '%s' ingress rule must specify 'from' to restrict sources.", [input.metadata.name])
}

# Egress to should not be empty (allow all)
deny[msg] {
    input.kind == "NetworkPolicy"
    rule := input.spec.egress[_]
    not rule.to
    msg := sprintf("NetworkPolicy '%s' egress rule must specify 'to' to restrict destinations.", [input.metadata.name])
}

# =============================================================================
# DENY OVERLY PERMISSIVE POLICIES
# =============================================================================

# Deny policies that allow all ingress from all namespaces
deny[msg] {
    input.kind == "NetworkPolicy"
    rule := input.spec.ingress[_]
    from := rule.from[_]
    from.namespaceSelector
    from.namespaceSelector.matchLabels == {}
    msg := sprintf("NetworkPolicy '%s' allows ingress from ALL namespaces. Restrict with specific labels.", [input.metadata.name])
}

# Deny policies that allow all egress to all namespaces
deny[msg] {
    input.kind == "NetworkPolicy"
    rule := input.spec.egress[_]
    to := rule.to[_]
    to.namespaceSelector
    to.namespaceSelector.matchLabels == {}
    msg := sprintf("NetworkPolicy '%s' allows egress to ALL namespaces. Restrict with specific labels.", [input.metadata.name])
}

# =============================================================================
# SERVICE-SPECIFIC REQUIREMENTS
# =============================================================================

# Database pods must only allow ingress from application namespaces
deny[msg] {
    input.kind == "NetworkPolicy"
    input.metadata.labels["app"] == "postgres"
    rule := input.spec.ingress[_]
    from := rule.from[_]
    not from.podSelector
    not from.namespaceSelector.matchLabels["name"] == "agassociates"
    msg := sprintf("PostgreSQL NetworkPolicy '%s' must only allow ingress from agassociates namespace.", [input.metadata.name])
}

# Redis pods must only allow ingress from application namespaces
deny[msg] {
    input.kind == "NetworkPolicy"
    input.metadata.labels["app"] == "redis"
    rule := input.spec.ingress[_]
    from := rule.from[_]
    not from.podSelector
    not from.namespaceSelector.matchLabels["name"] == "agassociates"
    msg := sprintf("Redis NetworkPolicy '%s' must only allow ingress from agassociates namespace.", [input.metadata.name])
}

# =============================================================================
# HELPER FUNCTIONS (Simulated - actual implementation needs data access)
# =============================================================================

# In real implementation, these would query the Kubernetes API
# For static analysis, we use labels/annotations as proxies

has_network_policy(namespace) {
    # In real implementation: query NetworkPolicies in namespace
    # For now, check for annotation
    input.metadata.annotations["network-policy-exists"] == "true"
}

has_default_deny_ingress(namespace) {
    # Check for default deny ingress policy
    input.metadata.annotations["default-deny-ingress"] == "true"
}

has_default_deny_egress(namespace) {
    # Check for default deny egress policy
    input.metadata.annotations["default-deny-egress"] == "true"
}

is_system_namespace(name) {
    name == "kube-system"
    name == "kube-public"
    name == "kube-node-lease"
    name == "monitoring"
    name == "ingress-nginx"
    name == "cert-manager"
    name == "coolify"
}

# =============================================================================
# AGGREGATE NETWORK POLICY CHECK
# =============================================================================

# Report overall network policy compliance
compliance[result] {
    network_policies := count_network_policies()
    namespaces_with_policies := count_namespaces_with_policies()
    total_namespaces := count_total_namespaces()
    
    result := {
        "total_network_policies": network_policies,
        "namespaces_with_policies": namespaces_with_policies,
        "total_namespaces": total_namespaces,
        "coverage_percentage": (namespaces_with_policies * 100) / total_namespaces
    }
}