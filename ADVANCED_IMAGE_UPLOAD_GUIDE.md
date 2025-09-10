# Advanced Image Upload System Guide

## 🚀 New Features Implemented

### 1. **Two Upload Methods in Toolbar**
- **Upload Button (↑)**: Quick upload with immediate insertion
- **Image Button (🖼)**: Advanced upload with text wrapping options [NEW]

### 2. **Advanced Upload Modal Features**
When clicking the Image button, you get:
- **File preview** before insertion
- **Edit option** to crop/rotate before inserting
- **5 Text Wrapping Modes**:
  - **Inline**: Image flows with text
  - **Left**: Text wraps on the right
  - **Right**: Text wraps on the left  
  - **Center**: Centered with text above/below
  - **Break Text**: Text breaks around image
- **Text Spacing Control**: 0-50px adjustable margin
- **Alt Text Input**: For accessibility

### 3. **In-Editor Image Controls**
After insertion, hover over any image to see:
- **Corner Resize Handles**: Drag to resize
- **Top Control Bar**:
  - Wrap mode buttons
  - Rotate button (90° increments)
  - Settings button
  - Remove button
- **Live Size Display**: Shows dimensions while resizing

## 📍 Where to Find It

### Test Page (Isolated Testing)
```
http://localhost:3000/test-image-upload
```

### Study Creation Page
```
http://localhost:3000/studies/create
```
1. Fill Step 1 (Basic Info)
2. Click "Next" to Step 2 (Welcome & Consent)
3. Look for TWO image buttons in the editor toolbar

## 🔍 Visual Differences

### Old System (Single Button)
```
[B] [I] [List] [Link] [↑Upload] [Color]
```

### New System (Two Buttons)
```
[B] [I] [List] [Link] [↑Upload] [🖼Image] [Color]
                        ↑         ↑
                      Quick    Advanced
```

## 🛠 Troubleshooting

### If you don't see the new button:

1. **Hard Refresh Browser**
   - Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or: Open DevTools → Right-click refresh → Empty Cache and Hard Reload

2. **Check Console for Errors**
   - Open DevTools (F12)
   - Check Console tab for red errors
   - If errors exist, restart the server

3. **Restart Dev Server**
   ```bash
   npm run stop:ultimate
   npm run dev:ultimate
   ```

4. **Verify Files Exist**
   ```bash
   ls frontend/components/editors/InlineImageUpload.tsx
   ls frontend/lib/tiptap/floating-image-extension.tsx
   ls frontend/styles/floating-image.css
   ```

## 📝 Usage Example

1. **Open editor** on Welcome or Consent page
2. **Click Image button** (not Upload button)
3. **Select an image file**
4. **Choose "Wrap text right"** mode
5. **Set spacing** to 15px
6. **Add alt text**: "Study diagram"
7. **Click "Insert Image"**
8. **Hover over inserted image** to see controls
9. **Drag corner** to resize
10. **Click wrap mode buttons** to change text flow

## 🎯 Key Benefits

- **Professional Layout**: Like Microsoft Word
- **Responsive Design**: Works on all devices
- **Accessibility**: Alt text support
- **User-Friendly**: Visual controls
- **Flexible**: Multiple wrap modes
- **Seamless**: Text reflows automatically

## 📱 Mobile Support

The system adapts for mobile:
- Floating images become block-level
- Touch-friendly resize handles
- Simplified controls

## 🔗 Files Created

- `/frontend/components/editors/InlineImageUpload.tsx`
- `/frontend/components/editors/ResizableImage.tsx`
- `/frontend/lib/tiptap/floating-image-extension.tsx`
- `/frontend/lib/tiptap/advanced-image-extension.tsx`
- `/frontend/styles/floating-image.css`
- `/frontend/__tests__/image-upload.test.tsx`
- `/frontend/app/test-image-upload/page.tsx`

---

**Note**: The new system works alongside the existing one. The old "Upload" button remains for quick uploads, while the new "Image" button provides advanced features.