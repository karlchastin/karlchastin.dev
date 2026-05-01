const MASK_GRADIENT = 'linear-gradient(to right, #000 85%, transparent 100%)';

export const scrollObserver = new ResizeObserver(entries => {
    requestAnimationFrame(() => {
        for (let entry of entries) {
            const wrapper = entry.target;
            const inner = wrapper.querySelector('.scroll-inner');
            const mainText = wrapper.querySelector('.main-text');
            const dupText = wrapper.querySelector('.dup-text');
            
            if (!inner || !mainText || !dupText || wrapper.clientWidth === 0) continue;
            
            if (mainText.offsetWidth - 40 > wrapper.clientWidth) {
                if (dupText.style.display !== 'inline-block') {
                    dupText.style.display = 'inline-block';
                    wrapper.style.maskImage = MASK_GRADIENT;
                    wrapper.style.webkitMaskImage = MASK_GRADIENT;
                    inner.style.animation = 'scrollText 14s linear infinite';
                }
            } else {
                if (dupText.style.display !== 'none') {
                    dupText.style.display = 'none';
                    wrapper.style.maskImage = 'none';
                    wrapper.style.webkitMaskImage = 'none';
                    inner.style.animation = 'none';
                }
            }
        }
    });
});

export const createScrollText = (text, isTitle, titleColor) => {
    if (!text) return '';
    const wrapperStyle = isTitle === 1 ? `font-size:11px; font-weight:800; color:${titleColor}; text-transform:uppercase; line-height: 1; margin-bottom: 6px;`
        : (isTitle === 2 ? `font-weight:800; font-size:15px; color:#fff; line-height: 1.1; margin-bottom: 5px;` : `font-size:13px; color:#aaa; line-height: 1.15; margin-bottom: 0px;`);
    
    return `<div class="scroll-wrapper" style="${wrapperStyle} width: 100%; min-width: 0; overflow: hidden; white-space: nowrap; position: relative;">
        <div class="scroll-inner" style="display: inline-block; white-space: nowrap;">
            <span class="main-text" style="display: inline-block; padding-right: 40px;">${text}</span><span class="dup-text" style="display: none; padding-right: 40px;">${text}</span>
        </div></div>`;
};