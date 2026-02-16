#!/bin/bash
# Logging utility functions for game engine

# Log levels
declare -A LOG_LEVELS=(
    [DEBUG]=0
    [INFO]=1
    [WARN]=2
    [ERROR]=3
)

# Current log level (default: INFO)
GAME_ENGINE_LOG_LEVEL="${GAME_ENGINE_LOG_LEVEL:-INFO}"

# Get numeric level
get_log_level() {
    echo "${LOG_LEVELS[$GAME_ENGINE_LOG_LEVEL]:-1}"
}

# Debug logging
debug() {
    if [[ $(get_log_level) -le 0 ]]; then
        echo "[DEBUG] $*" >&2
    fi
}

# Info logging
info() {
    if [[ $(get_log_level) -le 1 ]]; then
        echo "[INFO] $*" >&2
    fi
}

# Warning logging
warn() {
    if [[ $(get_log_level) -le 2 ]]; then
        echo "[WARN] $*" >&2
    fi
}

# Error logging
error() {
    if [[ $(get_log_level) -le 3 ]]; then
        echo "[ERROR] $*" >&2
    fi
}

# Log with context
log_context() {
    local level="$1"
    shift
    local context="$1"
    shift

    case "$level" in
        DEBUG) debug "[$context] $*" ;;
        INFO) info "[$context] $*" ;;
        WARN) warn "[$context] $*" ;;
        ERROR) error "[$context] $*" ;;
    esac
}
