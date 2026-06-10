```json
{
  "type": "object",
  "required": [
    "meeting_summary",
    "decisions",
    "tasks",
    "risks",
    "memory_candidates",
    "canon_change_candidates",
    "sensitive_flags",
    "people_updates",
    "organization_updates",
    "ccos_ledger_entries"
  ],
  "properties": {
    "meeting_summary": {
      "type": "object",
      "properties": {
        "short": {
          "type": "string"
        },
        "detailed": {
          "type": "string"
        },
        "confidence": {
          "type": "string",
          "enum": [
            "high",
            "medium",
            "low"
          ]
        }
      },
      "required": [
        "short",
        "detailed",
        "confidence"
      ]
    },
    "decisions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "decision": {
            "type": "string"
          },
          "status": {
            "type": "string",
            "enum": [
              "confirmed",
              "candidate",
              "unclear"
            ]
          },
          "source_evidence": {
            "type": "string"
          },
          "decision_maker": {
            "type": "string"
          },
          "canon_impact": {
            "type": "boolean"
          },
          "review_required": {
            "type": "boolean"
          }
        },
        "required": [
          "decision",
          "status",
          "source_evidence",
          "canon_impact",
          "review_required"
        ]
      }
    },
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "task": {
            "type": "string"
          },
          "owner": {
            "type": "string"
          },
          "due_date": {
            "type": "string"
          },
          "priority": {
            "type": "string",
            "enum": [
              "high",
              "medium",
              "low"
            ]
          },
          "source_evidence": {
            "type": "string"
          },
          "needs_owner": {
            "type": "boolean"
          }
        },
        "required": [
          "task",
          "priority",
          "source_evidence",
          "needs_owner"
        ]
      }
    },
    "risks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "risk": {
            "type": "string"
          },
          "category": {
            "type": "string"
          },
          "severity": {
            "type": "string",
            "enum": [
              "high",
              "medium",
              "low"
            ]
          },
          "source_evidence": {
            "type": "string"
          },
          "suggested_mitigation": {
            "type": "string"
          }
        },
        "required": [
          "risk",
          "severity",
          "source_evidence"
        ]
      }
    },
    "memory_candidates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "proposed_memory": {
            "type": "string"
          },
          "category": {
            "type": "string"
          },
          "source_evidence": {
            "type": "string"
          },
          "confidence": {
            "type": "string",
            "enum": [
              "high",
              "medium",
              "low"
            ]
          },
          "risk_if_added": {
            "type": "string"
          },
          "risk_if_ignored": {
            "type": "string"
          },
          "suggested_destination": {
            "type": "string"
          }
        },
        "required": [
          "proposed_memory",
          "source_evidence",
          "confidence"
        ]
      }
    },
    "canon_change_candidates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "affected_area": {
            "type": "string"
          },
          "affected_doc": {
            "type": "string"
          },
          "proposed_change": {
            "type": "string"
          },
          "reason": {
            "type": "string"
          },
          "source_evidence": {
            "type": "string"
          },
          "admin_review_required": {
            "type": "boolean"
          }
        },
        "required": [
          "affected_area",
          "proposed_change",
          "reason",
          "source_evidence",
          "admin_review_required"
        ]
      }
    },
    "sensitive_flags": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "issue": {
            "type": "string"
          },
          "reason": {
            "type": "string"
          },
          "recommended_handling": {
            "type": "string"
          }
        },
        "required": [
          "issue",
          "reason",
          "recommended_handling"
        ]
      }
    },
    "people_updates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "person": {
            "type": "string"
          },
          "update": {
            "type": "string"
          },
          "confidence": {
            "type": "string",
            "enum": [
              "high",
              "medium",
              "low"
            ]
          },
          "review_required": {
            "type": "boolean"
          }
        },
        "required": [
          "person",
          "update",
          "confidence",
          "review_required"
        ]
      }
    },
    "organization_updates": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "organization": {
            "type": "string"
          },
          "update": {
            "type": "string"
          },
          "confidence": {
            "type": "string",
            "enum": [
              "high",
              "medium",
              "low"
            ]
          },
          "review_required": {
            "type": "boolean"
          }
        },
        "required": [
          "organization",
          "update",
          "confidence",
          "review_required"
        ]
      }
    },
    "ccos_ledger_entries": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "ledger_type": {
            "type": "string",
            "enum": [
              "Tension",
              "Proposal",
              "Decision",
              "Role",
              "Policy",
              "Resource",
              "Accountability"
            ]
          },
          "entry": {
            "type": "string"
          },
          "source_evidence": {
            "type": "string"
          },
          "review_required": {
            "type": "boolean"
          }
        },
        "required": [
          "ledger_type",
          "entry",
          "source_evidence",
          "review_required"
        ]
      }
    }
  }
}
```
