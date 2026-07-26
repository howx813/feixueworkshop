/** Inline script: apply theme before paint to avoid flash. */
export const themeInitScript = `
(function(){
  try {
    var k='feixue-theme';
    var s=localStorage.getItem(k);
    var t=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;
