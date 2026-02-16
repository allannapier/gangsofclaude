#!/bin/bash
# JSON utility functions for game engine
# Provides safe JSON parsing and manipulation

# Get JSON value by path
# Usage: json_get <json_string> <path>
# Example: json_get '{"a":{"b":1}}' "a.b" => "1"
json_get() {
    local json="$1"
    local path="$2"
    echo "$json" | jq -r ".$path // empty"
}

# Set JSON value by path
# Usage: json_set <json_string> <path> <value>
json_set() {
    local json="$1"
    local path="$2"
    local value="$3"
    echo "$json" | jq ".$path = $value"
}

# Merge JSON objects
# Usage: json_merge <json1> <json2>
json_merge() {
    local json1="$1"
    local json2="$2"
    echo "$json1" | jq --argjson merge "$json2" '. + $merge'
}

# Get array length
# Usage: json_length <json_array>
json_length() {
    local json="$1"
    echo "$json" | jq 'length'
}

# Get array element by index
# Usage: json_get_index <json_array> <index>
json_get_index() {
    local json="$1"
    local index="$2"
    echo "$json" | jq ".[$index]"
}

# Check if key exists
# Usage: json_has_key <json> <key>
json_has_key() {
    local json="$1"
    local key="$2"
    echo "$json" | jq -r "has(\"$key\")"
}

# Validate JSON
# Usage: json_validate <string>
json_validate() {
    local str="$1"
    echo "$str" | jq '.' >/dev/null 2>&1
}

# Pretty print JSON
# Usage: json_pretty <json_string>
json_pretty() {
    local json="$1"
    echo "$json" | jq '.'
}
