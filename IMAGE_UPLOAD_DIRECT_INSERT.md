# Image Upload Direct Insert Implementation

## Summary
Modified the image upload functionality to directly insert images at cursor position without showing an intermediate configuration modal.

## Changes Made

### 1. RichTextEditorV2.tsx
- **Removed**: InlineImageUpload modal component
- **Added**: Direct image upload handler (`handleDirectImageUpload`)
- **Modified**: Image button to trigger file picker directly

### Key Features:
1. **Direct Insertion**: Images are now inserted immediately at cursor position
2. **Automatic Sizing**: Images are automatically resized to max 800px width while maintaining aspect ratio
3. **Default Settings**:
   - Wrap mode: `inline` (flows with text)
   - Margin: `10px`
   - Alt text: Uses filename by default

### How It Works:
1. User clicks image button
2. File picker opens
3. User selects image
4. Image is validated (type and size)
5. Image is uploaded to server
6. Image is inserted at cursor position with default settings
7. No intermediate modal or configuration step

### Validation:
- **File Type**: Must be an image file (image/*)
- **File Size**: Maximum 5MB
- **Dimensions**: Automatically resized if > 800px width

### User Experience:
- Faster workflow - no modal interruption
- Images insert instantly at cursor position
- Loading state shown during upload
- Error messages for validation failures

## Files Modified:
- `/frontend/components/editors/RichTextEditorV2.tsx`
  - Removed InlineImageUpload import
  - Removed showImageUpload state
  - Added fileInputRef and isUploading state
  - Added handleDirectImageUpload function
  - Modified image button behavior

## Technical Details:
```typescript
// Direct upload handler
const handleDirectImageUpload = async (event) => {
  // 1. Validate file
  // 2. Read as base64
  // 3. Get dimensions
  // 4. Upload to server
  // 5. Insert at cursor with defaults
}
```

## Benefits:
✅ Simpler user experience
✅ Faster image insertion
✅ No modal interruption
✅ Maintains cursor position
✅ Automatic sizing
✅ Still validates file type/size

## Note:
The InlineImageUpload component is still available in the codebase if advanced configuration is needed in the future, but it's no longer used in the main editor.