export default function FirstCustomerPopulerItem() {
  return (
    <div
      id="f0top_ankr_popularitem"
      className="mx-auto flex w-[calc(100%-40px)] max-w-[1050px] flex-col items-center justify-between md:flex-row md:items-center"
    >
      {/* Title block */}
      <div className="text-center">
        <span className="mx-auto mb-[15px] inline-block rounded-full bg-[#ef857d] px-[18px] py-[8px] font-[family-name:var(--font-open-sans)] text-[12px] leading-[12px] tracking-[0.48px] text-white md:mb-[20px] md:py-[10px] md:text-[20px] md:leading-[20px] md:tracking-[0.8px]">
          初めての方限定
        </span>
        <span className="block font-[family-name:var(--font-open-sans)] text-[40px] font-light leading-[40px] tracking-[3.2px] text-[#ef857d] md:text-[60px] md:leading-[60px] md:tracking-[4.8px]">
          POPULAR ITEM
        </span>
        <div className="mx-auto mt-[25px] max-w-[105px] md:mt-[16px] md:max-w-[144px]">
          <picture>
            <source
              srcSet="/assets/img-popular-item-benefit-sp.png"
              media="(max-width: 768px)"
            />
            <img
              src="/assets/img-popular-item-benefit.png"
              alt="豪華特典入り"
              className="w-full"
            />
          </picture>
        </div>
      </div>
      {/* Link button */}
      <a
        href="#ancPopularSet"
        className="mt-[30px] block max-w-[805px] md:ml-[60px] md:mt-0 md:shrink"
      >
        <picture>
          <source
            srcSet="/assets/img-popular-item-btn-sp.png"
            media="(max-width: 768px)"
          />
          <img
            src="/assets/img-popular-item-btn.png"
            alt="SNSで話題の特別セット"
            className="w-full"
          />
        </picture>
      </a>
    </div>
  );
}
