# Theme Extraction Guide

## 🔍 Issue Identified

Theme extraction returns empty results because it expects papers to be **saved in the database first**.

## ✅ Solution: Use Unified Theme Extraction

The **Unified Theme Extraction** endpoint allows you to extract themes directly from content without saving papers first.

### Endpoint

```
POST /api/literature/themes/unified-extract
```

### Example Request

```javascript
const response = await fetch(
  'http://localhost:4000/api/literature/themes/unified-extract',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${your_access_token}`,
    },
    body: JSON.stringify({
      sources: [
        {
          id: 'paper1',
          type: 'paper', // Must be lowercase: paper, youtube, podcast, tiktok, instagram
          title: 'Explainable AI',
          content:
            'This paper discusses explainable artificial intelligence...',
          metadata: {
            authors: ['John Doe'],
            year: 2024,
            doi: '10.1234/example',
          },
        },
      ],
      options: {
        minConfidence: 0.5,
        maxThemes: 10,
      },
    }),
  }
);
```

### Important Notes

1. **Source Type Values** - Must be lowercase:
   - `'paper'` (not `'PAPER'`)
   - `'youtube'`
   - `'podcast'`
   - `'tiktok'`
   - `'instagram'`

2. **Content Field** - This is where your text goes (abstract, transcript, etc.)

3. **Metadata** - Optional additional information about the source

## 🔄 Alternative: Save Papers First

If you want to use the regular theme extraction (`/api/literature/themes`), you must first save papers to your library:

### Step 1: Save Papers

```javascript
// Save a paper to your library
await fetch('http://localhost:4000/api/literature/save', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${your_access_token}`,
  },
  body: JSON.stringify({
    title: 'Paper Title',
    authors: ['Author Name'],
    year: 2024,
    abstract: 'Paper abstract text...',
    doi: '10.1234/example',
    url: 'https://...',
  }),
});
```

### Step 2: Extract Themes

```javascript
// Now you can extract themes using the saved paper IDs
await fetch('http://localhost:4000/api/literature/themes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${your_access_token}`,
  },
  body: JSON.stringify({
    paperIds: ['saved-paper-id-1', 'saved-paper-id-2'],
    numThemes: 5,
  }),
});
```

## 🧪 Testing

Run the test script to see all endpoints in action:

```bash
cd backend
npx ts-node test-theme-extraction.ts
```

## 💡 Recommendation

For most use cases, use the **Unified Theme Extraction** endpoint as it:

- Works with any content source
- Doesn't require saving to database first
- Provides full provenance tracking
- Handles multiple source types (papers, videos, podcasts, etc.)
