# Tooltip Component Improvements

## Overview
The tooltip component has been redesigned (InfoTooltipV2) to address usability, accessibility, and visual issues found in the original implementation.

## Key Improvements

### 1. Accessibility Enhancements
- **Full ARIA Support**: Proper `aria-describedby`, `aria-expanded` attributes
- **Keyboard Navigation**: 
  - Tab to focus tooltip triggers
  - Enter/Space to open tooltips
  - Escape to close tooltips
- **Focus Management**: Visual focus ring on keyboard navigation
- **Screen Reader Compatibility**: Proper role="tooltip" semantics

### 2. Usability Improvements
- **Smart Hover Delay**: 300ms default delay prevents accidental triggers
- **Hover Intent Detection**: Tooltip stays open when moving cursor to tooltip content
- **Auto-positioning**: Automatically finds best position to avoid viewport edges
- **Boundary Detection**: Ensures tooltips never appear off-screen
- **Smooth Animations**: 200ms fade-in/scale transitions for better UX

### 3. Technical Improvements
- **Portal Rendering**: Tooltips render in document.body to avoid z-index issues
- **React 18+ Compatibility**: Uses createPortal for proper rendering
- **Performance Optimized**: Only renders tooltip DOM when visible
- **TypeScript Support**: Fully typed component with proper interfaces

## Migration Guide

### Before (InfoTooltip v1)
```tsx
import InfoTooltip from '@/components/tooltips/InfoTooltip';

<InfoTooltip 
  title="Study Title"
  content="Description"
  position="top"
/>
```

### After (InfoTooltipV2)
```tsx
import InfoTooltipV2 from '@/components/tooltips/InfoTooltipV2';

<InfoTooltipV2 
  title="Study Title"
  content="Description"
  position="auto"  // New: auto-positioning
  delay={300}       // New: configurable delay
/>
```

## Feature Comparison

| Feature | v1 (Original) | v2 (Improved) |
|---------|--------------|---------------|
| Keyboard Navigation | ❌ | ✅ |
| ARIA Attributes | Partial | Full |
| Escape Key Support | ❌ | ✅ |
| Hover Delay | ❌ | ✅ (300ms default) |
| Auto-positioning | ❌ | ✅ |
| Boundary Detection | ❌ | ✅ |
| Portal Rendering | ❌ | ✅ |
| Smooth Animations | ❌ | ✅ |
| Hover Intent | ❌ | ✅ |
| Focus Management | ❌ | ✅ |

## Usage Examples

### Basic Usage
```tsx
<InfoTooltipV2 
  title="Field Help"
  content="This field requires..."
/>
```

### With Examples and Link
```tsx
<InfoTooltipV2 
  title="Study Title Best Practices"
  content="Keep your title concise and descriptive"
  examples={[
    'Climate Change Perceptions',
    'Healthcare Preferences Study'
  ]}
  link={{
    text: 'Learn more',
    href: '/docs/titles'
  }}
/>
```

### Auto-positioning (Recommended)
```tsx
<InfoTooltipV2 
  {...tooltipContent}
  position="auto"  // Automatically finds best position
/>
```

### Custom Delay
```tsx
<InfoTooltipV2 
  {...tooltipContent}
  delay={500}  // 500ms hover delay
/>
```

## Testing

The new component includes comprehensive tests covering:
- Rendering and visibility states
- Keyboard navigation
- Mouse interactions
- Accessibility attributes
- Portal rendering
- Animation classes
- Position calculations
- Edge cases (screen boundaries, multiple tooltips)

Run tests with:
```bash
npm test -- __tests__/tooltips.test.tsx
```

## Best Practices

1. **Use Auto-positioning**: Set `position="auto"` for most use cases
2. **Appropriate Delays**: Use 300-500ms delay to prevent accidental triggers
3. **Keep Content Concise**: Tooltips should provide quick help, not documentation
4. **Include Examples**: When helpful, provide 2-3 brief examples
5. **Add Links Sparingly**: Only link to detailed documentation when necessary
6. **Test Keyboard Navigation**: Ensure all tooltips are keyboard accessible

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All modern browsers with support for:
- CSS Grid/Flexbox
- React Portals
- IntersectionObserver API

## Performance Considerations

- Tooltips are only rendered in DOM when visible
- Portal rendering prevents layout recalculations
- Debounced hover events reduce unnecessary renders
- Optimized position calculations cache results

## Future Enhancements

Potential improvements for v3:
- Touch device support with long-press
- Tooltip placement preferences (preferred vs fallback)
- Custom animation durations
- Theme variants (error, warning, success)
- Rich content support (images, formatted text)
- Mobile-optimized layouts