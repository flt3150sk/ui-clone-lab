export default function FirstCustomerPopulerItemSpecialSet() {
  const items = [
    {
      href: "https://pr.orbis.co.jp/cosmetics/cleansingoil/200/?adid=f0top_popularitem",
      buyHref: "/order/transpage/?prdno1=100890&adid=f0top_popularitem",
      image: "/assets/img-popular-item-banner-01.png",
      alt: "オルビス ザ クレンジング オイル 2,200円(税込)",
    },
    {
      href: "https://pr.orbis.co.jp/cosmetics/wbuv/120-1/?adid=f0top_popularitem",
      buyHref: "/order/transpage/?prdno1=100969&adid=f0top_popularitem",
      image: "/assets/img-popular-item-banner-02.png",
      alt: "リンクルブライトUVプロテクター N 3,850円(税込)",
    },
    {
      href: "https://pr.orbis.co.jp/cosmetics/hairmilk/121-1/?adid=f0top_popularitem",
      buyHref: "/order/transpage/?prdno1=100970&adid=f0top_popularitem",
      image: "/assets/img-popular-item-banner-03.png",
      alt: "エッセンスインヘアミルク 1,320円(税込)",
    },
  ];

  const arrowWhite =
    "relative pr-4 after:absolute after:right-0 after:top-1/2 after:h-[10px] after:w-[6px] after:-translate-y-1/2 after:bg-[url('/assets/bg-link-arrow-next-white.png')] after:bg-contain after:bg-center after:bg-no-repeat";
  const arrowDark =
    "relative pr-4 after:absolute after:right-0 after:top-1/2 after:h-[10px] after:w-[6px] after:-translate-y-1/2 after:bg-[url('/assets/bg-link-arrow-next.png')] after:bg-contain after:bg-center after:bg-no-repeat";

  return (
    <section className="mx-auto w-[calc(100%-40px)] max-w-[1050px] pb-[100px] pt-[80px] font-[family-name:var(--font-orbis)] text-[14px] font-medium leading-[25.2px] text-[#231815] md:pb-[150px] md:pt-[150px]">
      {/* Title */}
      <h2 className="pb-[3px] text-center md:pb-px">
        <span className="mx-auto mb-[15px] block w-fit rounded-full bg-[#ef857d] px-[18px] py-2 text-[12px] font-normal leading-3 tracking-[0.48px] text-white md:mb-[20px] md:py-[10px] md:text-[20px] md:leading-5 md:tracking-[0.8px]">
          初めての方限定
        </span>
        <span className="block font-[family-name:var(--font-open-sans)] text-[35px] font-light leading-[35px] tracking-[2.1px] text-[#ef857d] md:text-[60px] md:leading-[60px] md:tracking-[3.6px]">
          POPULAR ITEM
        </span>
      </h2>

      {/* Lead image */}
      <div className="mx-auto mt-[26px] max-w-[215px] md:mt-[43px] md:max-w-[475px]">
        <picture>
          <source
            srcSet="/assets/img-popular-item-lead-sp.png"
            media="(max-width: 768px)"
          />
          <img
            src="/assets/img-popular-item-lead.png"
            alt="SNS話題アイテムの特別セット 豪華特典入り"
            className="w-full"
          />
        </picture>
      </div>

      {/* Product grid */}
      <div className="mt-[50px] flex flex-col gap-10 md:mt-[75px] md:grid md:grid-cols-3 md:gap-x-[25px] md:gap-y-10">
        {items.map((item) => (
          <div key={item.image}>
            <a href={item.href} className="block">
              <img src={item.image} alt={item.alt} className="w-full" />
            </a>
            <ul className="mt-[15px] flex justify-between md:mt-9">
              <li className="w-[47%]">
                <a
                  href={item.buyHref}
                  className="flex h-12 items-center justify-center bg-[#5c5a5a] px-5 text-center leading-none text-white md:h-[50px] md:text-[16px]"
                >
                  <span className={arrowWhite}>購入する</span>
                </a>
              </li>
              <li className="w-[47%]">
                <a
                  href={item.href}
                  className="flex h-12 items-center justify-center border border-[#5c5a5a] bg-white px-5 text-center leading-none md:h-[50px] md:text-[16px]"
                >
                  <span className={arrowDark}>詳しく見る</span>
                </a>
              </li>
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
