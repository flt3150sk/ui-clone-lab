// ref: 74bf36f2 (PC) | 07f17ddf (SP)
// src: https://www.orbis.co.jp/ (header)

const BASE = "https://www.orbis.co.jp/contents/common/images";

const NAV_ITEMS = [
  "新商品",
  "キャンペーン",
  "ブランド・シリーズ",
  "スキンケア",
  "メイク",
  "ヘア＆ボディケア",
  "インナーケア（食品）",
  "ボディウェア",
  "店舗情報",
  "マガジン",
];

const FONT_FAMILY =
  '"open sans", 游ゴシック体, YuGothic, "游ゴシック Medium", "Yu Gothic Medium", "YuGothic Medium", 游ゴシック, "Yu Gothic", "ヒラギノ角ゴ Pro W3", "Hiragino Kaku Gothic Pro", メイリオ, Meiryo, sans-serif';

function SearchIcon({ size = 21 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="rgb(35,24,21)" strokeWidth="1.4" />
      <line
        x1="14"
        y1="14"
        x2="19.5"
        y2="19.5"
        stroke="rgb(35,24,21)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function OrbisHeader() {
  return (
    <header
      className="is-fixed relative z-[1020] bg-white border-b border-[rgb(224,224,224)]"
      style={{
        fontFamily: FONT_FAMILY,
        fontWeight: 500,
        color: "rgb(35,24,21)",
      }}
    >
      {/* ===================== PC ===================== */}
      {/* Top bar: logo + icons + search */}
      <div className="hidden md:block">
        <div
          className="relative px-[80px] mx-auto"
          style={{ maxWidth: 1440, minWidth: 896 }}
        >
          {/* Logo (centered, static flow — margin-bottom leaks through container to create 60px gap)
              flex justify-center: Tailwind preflight sets img{display:block}, so text-center doesn't work */}
          <h1 className="header__logo pt-[50px] mb-[60px] flex justify-center">
            <a href="/">
              <img
                className="header__logoImg w-[188px] h-[48px]"
                src={`${BASE}/img-logo.png`}
                alt="オルビス公式オンラインショップ"
              />
            </a>
          </h1>

          {/* Top-right icons
              right-[80px]: absolute right is measured from container's padding edge (x:1280).
              Needs 80px offset to align with the original's content edge (x:1200). */}
          <div className="header__content absolute right-[80px] top-[20px] flex items-center">
            {/* Mypage */}
            <div className="header__mypage ml-[10px] mr-[15px]">
              <a
                className="header__mypageBtn relative block pr-[12px]"
                href="#"
              >
                <img
                  className="w-[24px] h-[24px]"
                  src={`${BASE}/img-header-mypagebtn.png`}
                  alt="マイページ"
                />
              </a>
            </div>

            {/* Cart */}
            <div className="header__cart mx-[10px]">
              <a className="header__cartBtn relative block pr-[12px]" href="#">
                <img
                  className="w-[26px] h-[23px]"
                  src={`${BASE}/img-header-cartbtn.png`}
                  alt="カート"
                />
                <span className="header__badge prdTotal_setArea absolute -top-[8px] right-0 w-[20px] h-[20px] rounded-full bg-[rgb(239,133,125)] text-white text-[11px] leading-[20px] text-center block">
                  0
                </span>
              </a>
            </div>

            {/* Hamburger */}
            <div className="header__menu ml-[20px] -mr-[40px]">
              <a
                className="header__menuBtn relative block px-[10px] w-[20px] h-[15px]"
                href="#"
              >
                <span className="absolute top-0 left-0 w-[20px] h-[1px] rounded-[4px] bg-[rgb(35,24,21)]" />
                <span className="absolute top-[7px] left-0 w-[20px] h-[1px] rounded-[4px] bg-[rgb(35,24,21)]" />
                <span className="absolute top-[14px] left-0 w-[20px] h-[1px] rounded-[4px] bg-[rgb(35,24,21)]" />
              </a>
            </div>
          </div>

          {/* Search bar
              right-[40px]: absolute right from container's padding edge (x:1280).
              Original right edge is at x:1240 → 1280-1240=40px. */}
          <div className="header__search absolute top-[80px] right-[40px] w-[335px] h-[31px]">
            <form className="header__searchForm flex items-center px-[2px] h-[31px] border-b border-[rgb(142,142,142)]">
              <button
                type="submit"
                className="relative overflow-hidden w-[21px] h-[20px] shrink-0"
                aria-label="検索"
              >
                <SearchIcon size={20} />
              </button>
              <input
                id="kw_m"
                type="search"
                className="flex-1 h-[30px] text-[13px] outline-none bg-white text-[rgb(35,24,21)] rounded-[3px] pl-[4px]"
                placeholder="キーワード・商品番号を入力"
                style={{ fontFamily: FONT_FAMILY }}
              />
            </form>
          </div>
        </div>
      </div>

      {/* PC Nav bar */}
      <div className="hidden md:block">
        <div
          className="relative px-[80px] mx-auto h-[63px]"
          style={{ maxWidth: 1440, minWidth: 896 }}
        >
          <div className="headerNav relative z-[1000] pb-[40px]">
            <div className="headerNav__list flex flex-row justify-between h-[23px]">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item}
                  className="headerNav__listItem relative z-[110] text-center text-[13px] leading-[23.4px]"
                >
                  <a
                    className="headerNav__category--arrow block px-[5px] text-[rgb(35,24,21)] whitespace-nowrap"
                    href="#"
                  >
                    {item}
                    <span className="inline-block ml-[3px] text-[10px]">∨</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===================== SP ===================== */}
      <div className="md:hidden">
        <div className="is-smartbnr-show relative px-[20px] h-[60px] bg-white">
          <div className="header is-hide--pc relative h-[60px]">
            {/* Logo (centered) */}
            <p className="header__logo absolute inset-x-0 top-0 flex justify-center pt-[20px] pointer-events-none">
              <a href="/" className="pointer-events-auto">
                <img
                  className="header__logoImg w-[94px] h-[24px]"
                  src={`${BASE}/img-logo.png`}
                  alt="ORBIS"
                />
              </a>
            </p>

            {/* SP icon overlay */}
            <div className="header__content absolute inset-0">
              {/* Hamburger — left:-20px of container (= x:0 from page) */}
              <div
                className="headerNav absolute top-0 h-[60px] w-[52px]"
                style={{ left: -20 }}
              >
                <a
                  className="header__menuBtn absolute block w-[20px] h-[15px]"
                  style={{ top: 18, left: 16 }}
                  href="#"
                >
                  <span className="absolute top-0 w-[20px] h-[1px] rounded-[4px] bg-[rgb(35,24,21)]" />
                  <span className="absolute top-[7px] w-[20px] h-[1px] rounded-[4px] bg-[rgb(35,24,21)]" />
                  <span className="absolute top-[14px] w-[20px] h-[1px] rounded-[4px] bg-[rgb(35,24,21)]" />
                </a>
                <span
                  className="header__txt headerNav__menu absolute w-[40px] text-[10px] leading-[18px] text-center"
                  style={{ bottom: 3, left: 6 }}
                >
                  メニュー
                </span>
              </div>

              {/* Search — left:32px of container (= x:52 from page) */}
              <div
                className="header__search absolute top-0 h-[60px] w-[52px]"
                style={{ left: 32 }}
              >
                <a
                  className="header__searchBtn absolute block overflow-hidden"
                  style={{ top: 14, left: 15, width: 21, height: 21 }}
                  href="#"
                  aria-label="検索"
                >
                  <SearchIcon size={21} />
                </a>
                <span
                  className="header__txt absolute text-[10px] leading-[18px] text-center"
                  style={{ bottom: 3, left: 16, width: 20 }}
                >
                  検索
                </span>
              </div>

              {/* Mypage — left:266px of container (= x:286 from page) */}
              <div
                className="header__mypage absolute top-0 h-[60px] w-[52px]"
                style={{ left: 266 }}
              >
                <a
                  className="header__mypageBtn absolute block pr-[2px]"
                  style={{ top: 12, left: 13 }}
                  href="#"
                >
                  <img
                    className="mt-[2px] w-[24px] h-[24px]"
                    src={`${BASE}/img-header-mypagebtn.png`}
                    alt=""
                  />
                </a>
                <span
                  className="header__txt absolute text-[10px] leading-[18px] text-center"
                  style={{ bottom: 3, left: 1, width: 50 }}
                >
                  マイページ
                </span>
              </div>

              {/* Cart — left:318px of container (= x:338 from page) */}
              <div
                className="header__cart absolute top-0 h-[60px] w-[52px]"
                style={{ left: 318 }}
              >
                <a
                  className="header__cartBtn absolute block pr-[2px]"
                  style={{ top: 12, left: 12 }}
                  href="#"
                >
                  <img
                    className="mt-[3px] w-[26px] h-[23px]"
                    src={`${BASE}/img-header-cartbtn.png`}
                    alt=""
                  />
                  <span
                    className="header__badge prdTotal_setArea absolute w-[16px] h-[16px] rounded-full bg-[rgb(239,133,125)] text-white text-[10px] leading-[16px] text-center block"
                    style={{ top: -5, left: 17 }}
                  >
                    0
                  </span>
                </a>
                <span
                  className="header__txt absolute text-[10px] leading-[18px] text-center"
                  style={{ bottom: 3, left: 11, width: 30 }}
                >
                  カート
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
