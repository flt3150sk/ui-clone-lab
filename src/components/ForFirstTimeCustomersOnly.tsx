export default function ForFirstTimeCustomersOnly() {
  const items = [
    {
      href: "#ancOrbisUdotSet",
      img: "/assets/img-icon-skin-care-set-01.png",
      imgSp: "/assets/img-icon-skin-care-set-01-sp.png",
      sub: "シミも乾燥も結果主義にこだわる",
      main: "最高峰エイジングケア",
    },
    {
      href: "#ancOrbisUSet",
      img: "/assets/img-icon-skin-care-set-02.png",
      imgSp: "/assets/img-icon-skin-care-set-02-sp.png",
      sub: "肌の揺らぎが気になる方の",
      main: "徹底うるおいケア",
    },
    {
      href: "#ancClearfulSet",
      img: "/assets/img-icon-skin-care-set-03.png",
      imgSp: "/assets/img-icon-skin-care-set-03-sp.png",
      sub: <>子供も大人も、<br className="hidden md:inline" />くり返しニキビのための</>,
      main: "薬用ニキビケア",
    },
    {
      href: "#ancMrSet",
      img: "/assets/img-icon-skin-care-set-04.png",
      imgSp: "/assets/img-icon-skin-care-set-04-sp.png",
      sub: <>テカりに悩む方に清潔感を<br className="hidden md:inline" />科学した</>,
      main: "男性用スキンケア",
    },
    {
      href: "#ancAmberSet",
      img: "/assets/img-icon-skin-care-set-05.png",
      imgSp: "/assets/img-icon-skin-care-set-05-sp.png",
      sub: <>シミもシワも<br className="hidden md:inline" />これひとつでケアする</>,
      main: "高機能オールインワン",
    },
  ];

  return (
    <div className="px-[20px] md:px-0 pt-[100px] md:pt-[160px] flex justify-center">
    <section
      className="max-w-[1050px] w-full font-[family-name:var(--font-orbis)] flex flex-col items-center"
    >
      {/* Title */}
      <div className="flex flex-col items-center gap-[13px] md:gap-[20px]">
        <span className="inline-block bg-[#9d8735] text-white text-[12px] md:text-[20px] leading-[1] tracking-[0.48px] md:tracking-[0.8px] px-[18px] py-[7px] md:py-[10px] rounded-[30px]">
          初めての方限定
        </span>
        <p className="text-[40px] md:text-[60px] font-light leading-[1] tracking-[2.4px] md:tracking-[3.6px] text-[#9d8735] font-[family-name:var(--font-open-sans),sans-serif]">
          SKIN CARE SET
        </p>
      </div>

      {/* Price Image */}
      <div className="text-center pt-[25px] md:pt-[42px]">
        <picture>
          <source
            srcSet="/assets/img-skin-care-price-01.png"
            media="(min-width: 769px)"
          />
          <img
            src="/assets/img-skin-care-price-01-sp.png"
            alt="豪華特典入り 人気スキンケア特別セット 980円(税込)"
            className="inline-block max-w-[212px] md:max-w-[566px] h-auto"
          />
        </picture>
      </div>

      {/* Items Grid */}
      <ul className="pt-[20px] md:pt-[72px] w-full md:grid md:grid-cols-3 md:gap-[36px_25px] md:[grid-template-rows:190px_190px] md:items-end">
        {items.map((item, i) => (
          <li key={i} className={`border-b border-[#c8c2b3] md:border-0 md:pt-0 ${i === 0 ? '' : i === items.length - 1 ? 'pt-[33px]' : 'pt-[13px]'}`}>
            <a
              href={item.href}
              className="flex items-end pb-[12px] md:pb-[20px]"
            >
              {/* Product Image */}
              <picture className="shrink-0 w-[60px] md:w-[110px]">
                <source
                  srcSet={item.imgSp}
                  media="(max-width: 768px)"
                />
                <img
                  src={item.img}
                  alt=""
                  className="w-full h-auto"
                />
              </picture>

              {/* Text */}
              <span className="flex-1 text-[#231815] pl-[22px] md:pl-[10px]">
                <span className="text-[13px] md:text-[15px] leading-[1.5] font-medium block">
                  {item.sub}
                </span>
                <span className="text-[18px] md:text-[26px] leading-[1.5] font-medium block">
                  {item.main}
                </span>
              </span>

              {/* Arrow */}
              <span className="shrink-0 w-[48px] flex items-center justify-center self-end pb-[4px]">
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                  className="text-[#9d8735]"
                >
                  <path
                    d="M1 1L6 6L11 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
    </div>
  );
}
