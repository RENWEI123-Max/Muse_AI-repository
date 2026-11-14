#!/bin/sh
# Run from client. Same patterns and scope for each invocation.
for pattern in '#[0-9a-fA-F]{3,8}' 'rgba?\(' '!important' '\.device\s'; do
 count=$( (grep -REn "$pattern" src/styles/pages src/styles/components.css src/styles/base.css src/components/MomentsFlow.vue || true) | wc -l)
 printf '%s pages/components/base/MomentsFlow total=%s\n' "$pattern" "$count"
done
for file in src/styles.css src/fidelity.css; do
 count=$( (grep -En '\.d5|\.profile-card-actions|\.moment-|\.moments-|\.d5-panel|\.d5-sheet|\.d5-page|\.d5-item' "$file" || true) | wc -l)
 printf '%s legacy moments selectors=%s\n' "$file" "$count"
done
