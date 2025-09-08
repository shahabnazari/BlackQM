'use client';

export default function MinimalTest() {
  if (typeof window !== 'undefined') {
    console.log('CLIENT: JavaScript is executing!');
    (window as any).__JS_WORKS__ = true;
  }
  
  return (
    <div>
      <h1>Minimal Test</h1>
      <p>Check browser console for "CLIENT: JavaScript is executing!"</p>
      <script dangerouslySetInnerHTML={{ __html: `
        console.log('INLINE: Script executed');
        document.getElementById('status').textContent = 'INLINE SCRIPT WORKED';
      `}} />
      <div id="status">Initial Status</div>
    </div>
  );
}