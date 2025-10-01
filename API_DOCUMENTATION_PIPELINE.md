# Phase 9 Day 11 - Pipeline API Documentation

## Complete Research Pipeline API Reference

This document provides comprehensive documentation for the Literature → Study → Analysis → Report pipeline API endpoints implemented in Phase 9.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Literature APIs](#literature-apis)
4. [Theme Extraction APIs](#theme-extraction-apis)
5. [Statement Generation APIs](#statement-generation-apis)
6. [Study Creation APIs](#study-creation-apis)
7. [Analysis APIs](#analysis-apis)
8. [Comparison APIs](#comparison-apis)
9. [Report Generation APIs](#report-generation-apis)
10. [Knowledge Graph APIs](#knowledge-graph-apis)
11. [Error Handling](#error-handling)
12. [Rate Limiting](#rate-limiting)

---

## Overview

The VQMethod Pipeline API provides a complete research workflow from literature discovery to report generation. All endpoints follow RESTful conventions and return JSON responses.

### Base URL

```
Production: https://api.vqmethod.com/api
Development: http://localhost:4000/api
```

### Response Format

```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2025-10-01T12:00:00Z",
    "version": "1.0.0",
    "requestId": "uuid-v4"
  }
}
```

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "meta": {
    "timestamp": "2025-10-01T12:00:00Z",
    "requestId": "uuid-v4"
  }
}
```

---

## Authentication

All API endpoints require JWT authentication except public search endpoints.

### Headers

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Get Token

```http
POST /api/auth/login
```

**Request:**

```json
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "expiresIn": 3600,
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "User Name"
    }
  }
}
```

---

## Literature APIs

### Search Literature

Search across multiple academic databases for relevant papers.

```http
POST /api/literature/search
```

**Request:**

```json
{
  "query": "climate change public opinion",
  "sources": ["semantic-scholar", "crossref", "pubmed", "arxiv"],
  "filters": {
    "yearRange": {
      "start": 2020,
      "end": 2025
    },
    "openAccess": true,
    "peerReviewed": true
  },
  "limit": 50,
  "offset": 0,
  "sortBy": "relevance"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "papers": [
      {
        "id": "paper-id",
        "title": "Paper Title",
        "authors": ["Author 1", "Author 2"],
        "year": 2024,
        "abstract": "Abstract text...",
        "doi": "10.1234/example",
        "citations": 45,
        "source": "semantic-scholar",
        "url": "https://...",
        "openAccess": true,
        "relevanceScore": 0.95
      }
    ],
    "totalResults": 1234,
    "sources": {
      "semantic-scholar": 500,
      "crossref": 400,
      "pubmed": 234,
      "arxiv": 100
    },
    "facets": {
      "years": {},
      "authors": {},
      "journals": {}
    }
  }
}
```

### Save Papers to Library

```http
POST /api/literature/save
```

**Request:**

```json
{
  "paperIds": ["paper-1", "paper-2"],
  "collectionId": "collection-id",
  "tags": ["climate", "opinion"],
  "notes": "Relevant for study X"
}
```

### Get Research Gaps

```http
POST /api/literature/gaps
```

**Request:**

```json
{
  "paperIds": ["paper-1", "paper-2"],
  "analysisDepth": "comprehensive",
  "includeOpportunities": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "gaps": [
      {
        "id": "gap-1",
        "title": "Youth perspectives understudied",
        "description": "Limited research on Gen Z climate attitudes",
        "priority": "high",
        "evidence": ["paper-1", "paper-3"],
        "suggestedMethods": ["Q-methodology", "interviews"],
        "estimatedImpact": 0.85
      }
    ],
    "opportunities": [
      {
        "id": "opp-1",
        "type": "methodological",
        "description": "Apply Q-methodology to youth cohort",
        "novelty": 0.9,
        "feasibility": 0.7
      }
    ]
  }
}
```

---

## Theme Extraction APIs

### Extract Themes from Papers

```http
POST /api/literature/extract-themes
```

**Request:**

```json
{
  "paperIds": ["paper-1", "paper-2"],
  "extractionMode": "comprehensive",
  "includeControversies": true,
  "minConfidence": 0.7
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "themes": [
      {
        "id": "theme-1",
        "name": "Economic concerns",
        "description": "Trade-offs between economy and environment",
        "papers": ["paper-1", "paper-2"],
        "prevalence": 0.75,
        "confidence": 0.85,
        "keywords": ["economy", "jobs", "growth"],
        "stances": {
          "supportive": 0.3,
          "opposed": 0.5,
          "neutral": 0.2
        }
      }
    ],
    "controversies": [
      {
        "id": "controversy-1",
        "theme": "theme-1",
        "description": "Disagreement on economic impact",
        "papers": {
          "supporting": ["paper-1"],
          "opposing": ["paper-2"]
        }
      }
    ],
    "confidence": 0.82
  }
}
```

---

## Statement Generation APIs

### Generate Statements from Themes

```http
POST /api/ai/statements/generate
```

**Request:**

```json
{
  "themes": [
    {
      "id": "theme-1",
      "name": "Economic concerns",
      "stances": {}
    }
  ],
  "paperContext": ["paper-1", "paper-2"],
  "count": 40,
  "config": {
    "ensureControversy": true,
    "balanceViewpoints": true,
    "biasCheck": true,
    "readabilityLevel": "general",
    "language": "en"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "statements": [
      {
        "id": "stmt-1",
        "text": "Economic growth should take priority over environmental protection",
        "theme": "theme-1",
        "viewpoint": "economic-priority",
        "provenance": {
          "papers": ["paper-1"],
          "themes": ["theme-1"],
          "confidence": 0.85
        },
        "biasScore": 0.2,
        "readability": 8.5
      }
    ],
    "statistics": {
      "total": 40,
      "byTheme": {},
      "byViewpoint": {},
      "averageBias": 0.15
    },
    "biasCheckPassed": true
  }
}
```

---

## Study Creation APIs

### Create Study with Pipeline Data

```http
POST /api/studies/create
```

**Request:**

```json
{
  "title": "Climate Change Opinion Study",
  "description": "Exploring public perspectives on climate action",
  "statements": ["stmt-1", "stmt-2"],
  "gridConfig": {
    "columns": 11,
    "distribution": [-4, -3, -2, -1, 0, 1, 2, 3, 4],
    "labels": {
      "left": "Strongly Disagree",
      "right": "Strongly Agree"
    }
  },
  "pipelineData": {
    "basedOnPapers": ["paper-1", "paper-2"],
    "extractedThemes": ["theme-1", "theme-2"],
    "researchGapId": "gap-1",
    "studyContext": {
      "topic": "climate change opinion",
      "researchQuestions": ["RQ1", "RQ2"],
      "targetAudience": "General public"
    }
  },
  "settings": {
    "targetParticipants": 30,
    "allowAnonymous": true,
    "requireDemographics": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "study-id",
    "status": "draft",
    "shareableLink": "https://vqmethod.com/s/study-id",
    "pipelineMetadata": {
      "papersLinked": 2,
      "themesUsed": 2,
      "gapAddressed": "gap-1",
      "provenanceComplete": true
    }
  }
}
```

---

## Analysis APIs

### Run Q-Methodology Analysis

```http
POST /api/analysis/q-methodology
```

**Request:**

```json
{
  "studyId": "study-id",
  "analysisConfig": {
    "extractionMethod": "centroid",
    "rotationMethod": "varimax",
    "numberOfFactors": 3,
    "significanceLevel": 0.05,
    "minLoadingThreshold": 0.4
  },
  "options": {
    "bootstrap": true,
    "iterations": 1000
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "factors": [
      {
        "id": "factor-1",
        "number": 1,
        "eigenvalue": 4.23,
        "varianceExplained": 28.5,
        "loadings": [],
        "zScores": [],
        "distinguishingStatements": [],
        "interpretation": "Pro-environmental action"
      }
    ],
    "totalVarianceExplained": 65.3,
    "correlationMatrix": [],
    "consensusStatements": [],
    "bootstrap": {
      "confidence": 0.95,
      "intervals": {}
    }
  }
}
```

---

## Comparison APIs

### Compare to Literature

```http
POST /api/analysis/compare-to-literature
```

**Request:**

```json
{
  "studyId": "study-id",
  "analysisResults": {
    "factors": [],
    "findings": []
  },
  "paperIds": ["paper-1", "paper-2"],
  "comparisonDepth": "comprehensive"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "findings": {
      "confirmatory": [
        {
          "id": "finding-1",
          "studyResult": "Strong environmental concern",
          "literatureSupport": ["paper-1", "paper-3"],
          "confidence": 0.89,
          "significance": "high"
        }
      ],
      "novel": [
        {
          "id": "finding-2",
          "studyResult": "Youth activism patterns",
          "noveltyScore": 0.92,
          "potentialImpact": "high"
        }
      ],
      "contradictory": [
        {
          "id": "finding-3",
          "studyResult": "Economic priority reversal",
          "literatureConflict": ["paper-2"],
          "possibleExplanations": []
        }
      ]
    },
    "discussionPoints": [
      {
        "point": "Novel youth engagement patterns suggest...",
        "supportingEvidence": [],
        "implications": []
      }
    ],
    "gapsCovered": ["gap-1"],
    "confidence": 0.85
  }
}
```

---

## Report Generation APIs

### Generate Academic Report

```http
POST /api/reports/generate
```

**Request:**

```json
{
  "studyId": "study-id",
  "format": "academic",
  "sections": [
    "abstract",
    "introduction",
    "literature_review",
    "methodology",
    "results",
    "discussion",
    "conclusion",
    "references"
  ],
  "options": {
    "citationStyle": "apa",
    "includeVisualizations": true,
    "includeAppendices": true,
    "language": "en",
    "academicLevel": "graduate",
    "length": "standard"
  },
  "customInstructions": "Focus on policy implications"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "reportId": "report-id",
    "status": "generating",
    "estimatedTime": 30,
    "sections": {
      "abstract": {
        "status": "complete",
        "wordCount": 250
      }
    },
    "downloadUrl": "/api/reports/download/report-id",
    "formats": {
      "pdf": "/api/reports/download/report-id.pdf",
      "word": "/api/reports/download/report-id.docx",
      "latex": "/api/reports/download/report-id.tex"
    }
  }
}
```

### Check Report Status

```http
GET /api/reports/status/{reportId}
```

### Download Report

```http
GET /api/reports/download/{reportId}.{format}
```

---

## Knowledge Graph APIs

### Update Knowledge Graph

```http
POST /api/knowledge/update-graph
```

**Request:**

```json
{
  "studyId": "study-id",
  "findings": [],
  "papers": [],
  "themes": [],
  "connections": {
    "paperToStudy": true,
    "studyToFindings": true,
    "findingsToGaps": true,
    "crossStudyPatterns": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "node-1",
        "type": "study",
        "label": "Climate Opinion Study",
        "metadata": {}
      }
    ],
    "edges": [
      {
        "source": "node-1",
        "target": "node-2",
        "type": "informs",
        "strength": 0.85
      }
    ],
    "patterns": [
      {
        "id": "pattern-1",
        "type": "convergence",
        "description": "Multiple studies confirm...",
        "nodes": ["node-1", "node-3"]
      }
    ],
    "statistics": {
      "totalNodes": 45,
      "totalEdges": 78,
      "density": 0.08,
      "clusters": 3
    }
  }
}
```

### Get Knowledge Graph

```http
GET /api/knowledge/graph/{studyId}
```

### Query Knowledge Graph

```http
POST /api/knowledge/query
```

**Request:**

```json
{
  "query": {
    "nodeType": "finding",
    "filters": {
      "category": "novel",
      "confidence": { "min": 0.7 }
    },
    "depth": 2,
    "includeRelated": true
  }
}
```

---

## Error Handling

### Error Codes

| Code                  | Description              | HTTP Status |
| --------------------- | ------------------------ | ----------- |
| `AUTH_REQUIRED`       | Authentication required  | 401         |
| `AUTH_INVALID`        | Invalid token            | 401         |
| `PERMISSION_DENIED`   | Insufficient permissions | 403         |
| `NOT_FOUND`           | Resource not found       | 404         |
| `VALIDATION_ERROR`    | Invalid request data     | 400         |
| `RATE_LIMIT_EXCEEDED` | Too many requests        | 429         |
| `INTERNAL_ERROR`      | Server error             | 500         |
| `SERVICE_UNAVAILABLE` | External service down    | 503         |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "yearRange.start",
      "constraint": "Must be between 1900 and current year",
      "provided": 1800
    }
  },
  "meta": {
    "timestamp": "2025-10-01T12:00:00Z",
    "requestId": "uuid-v4"
  }
}
```

---

## Rate Limiting

All API endpoints are rate-limited to prevent abuse.

### Limits

| Endpoint Type     | Authenticated | Anonymous |
| ----------------- | ------------- | --------- |
| Literature Search | 100/minute    | 10/minute |
| AI Generation     | 30/minute     | N/A       |
| Analysis          | 20/minute     | N/A       |
| Report Generation | 5/minute      | N/A       |
| General API       | 1000/hour     | 100/hour  |

### Headers

Response headers indicate rate limit status:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1696161600
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please wait before retrying.",
    "details": {
      "limit": 100,
      "reset": "2025-10-01T12:00:00Z",
      "retryAfter": 60
    }
  }
}
```

---

## Webhooks

Subscribe to pipeline events for real-time updates.

### Register Webhook

```http
POST /api/webhooks/register
```

**Request:**

```json
{
  "url": "https://your-app.com/webhook",
  "events": ["analysis.complete", "report.ready", "knowledge.updated"],
  "secret": "webhook-secret"
}
```

### Webhook Payload

```json
{
  "event": "analysis.complete",
  "data": {
    "studyId": "study-id",
    "analysisId": "analysis-id",
    "status": "complete"
  },
  "timestamp": "2025-10-01T12:00:00Z",
  "signature": "hmac-sha256-signature"
}
```

---

## SDK Support

### JavaScript/TypeScript

```typescript
import { VQMethodClient } from '@vqmethod/sdk';

const client = new VQMethodClient({
  apiKey: 'your-api-key',
  environment: 'production',
});

// Search literature
const papers = await client.literature.search({
  query: 'climate change',
  limit: 50,
});

// Generate statements
const statements = await client.ai.generateStatements({
  themes: papers.themes,
  count: 40,
});

// Create study
const study = await client.studies.create({
  title: 'My Study',
  statements: statements.data,
});
```

### Python

```python
from vqmethod import VQMethodClient

client = VQMethodClient(
    api_key='your-api-key',
    environment='production'
)

# Search literature
papers = client.literature.search(
    query='climate change',
    limit=50
)

# Generate statements
statements = client.ai.generate_statements(
    themes=papers.themes,
    count=40
)
```

---

## Support

For API support and questions:

- Documentation: https://docs.vqmethod.com/api
- Status: https://status.vqmethod.com
- Support: api-support@vqmethod.com
- GitHub: https://github.com/vqmethod/api-sdk

---

**Version:** 1.0.0
**Last Updated:** October 1, 2025
**Phase 9 Day 11 Implementation**
