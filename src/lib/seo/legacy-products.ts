// Explicit aliases cover renamed products from the previous printed/web catalog.
export const legacyProductAliases: Record<string, string> = {
  "flp-wp-cleanroom-switch-socket": "flpwp-clean-room-switch-socket-fitting",
  "flp-wp-100-dia-junction-box": "flpwp-junction-box-100-dia",
  "flp-wp-150-dia-junction-box": "flpwp-junction-box-150dia",
  "flp-wp-well-glass": "flpwp-well-glass-fitting",
  "flp-wp-tubelight": "flpwp-tubelight-fitting",
  "flp-wp-switch-socket": "flpwp-switch-socket-unit",
  "flp-wp-on-off-rotary-switch": "flpwp-rotary-switch",
  "flp-wp-cleanroom-rotary-switch": "flpwp-clean-room-rotary-switch",
  "flp-wp-cleanroom-push-button": "flpwp-clean-room-push-button",
  "flp-wp-ack-hooter": "flpwp-hooter-ack",
  "flp-wp-human-static-discharge-unit": "flpwp-human-body-static-unit",
  "flp-wp-350-dia-junction-box-threaded": "flpwp-junction-box-350dia",
  "flp-wp-small-flood-light-sunflower-type": "flpwp-small-flood-light-fitting",
  "flp-wp-flood-light-sunflower-type": "flpwp-flood-light-fitting",
  "flp-wp-big-flood-light-sunflower-type": "flpwp-big-flood-light-fitting",
  "flp-wp-r-v-lamp-fitting-holder-type": "flpwp-reactor-vessel-lamp-holder-type",
  "flp-wp-525-x-525-panel-box": "flpwp-525-x-525-panel",
  "flp-wp-roller-limit-switch": "flpwp-limit-switch",
  "flp-wp-stop-forward-reverse-station": "flpwp-stop-forward-reverse",
  "flp-wp-temperature-controller": "flpwp-temp-controller",
};

export function legacyProductCandidates(slug: string) {
  const lowercase = slug.toLowerCase();
  const normalized = lowercase.replace(/^flp-wp-/, "flpwp-");
  const cleanRoom = normalized.replace(/cleanroom/g, "clean-room");
  return [...new Set([legacyProductAliases[lowercase], lowercase, normalized, cleanRoom].filter((value): value is string => Boolean(value)))];
}
