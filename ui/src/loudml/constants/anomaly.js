export const DEFAULT_ANOMALY_TYPE = [
    { text: 'low', value: 'low', },
    { text: 'high', value: 'high', },
    { text: 'low/high', value: 'low_high', }
]

export const ANOMALY_HOOK_NAME = 'add_annotation'

export const ANOMALY_HOOK = {
    "type": "annotations",
    "name": ANOMALY_HOOK_NAME,
    "config": {
        "id": "not-used",
        "type": "loudml",
        "datasource": null,
    },
}
