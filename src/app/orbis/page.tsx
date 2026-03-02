/* eslint-disable @next/next/no-img-element */
export default function OrbisPage() {
  return (
    <div className="text-[14px] font-medium text-[rgb(35,24,21)] leading-[25.2px]">
      {/* ===== HEADER ===== */}
      <header className="bg-white border-b border-[rgb(224,224,224)] md:relative fixed top-0 left-0 right-0 z-[1020]">
        {/* PC Header */}
        <div className="hidden md:block px-[80px]">
          <div className="max-w-[1440px] mx-auto">
            <div className="pt-[50px]">
              <h1>
                <img
                  src="/assets/orbis/img-logo.png"
                  alt="ORBIS"
                  className="w-[188px] h-[48px]"
                />
              </h1>
              {/* PC utility icons (mypage, cart, menu) */}
              <div className="absolute top-[36px] right-[80px] flex items-center gap-[8px]">
                <a href="#" className="block px-[12px]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </a>
                <a href="#" className="block px-[12px]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                </a>
                <a href="#" className="block px-[10px]">
                  <svg width="20" height="15" viewBox="0 0 20 15" fill="rgb(35,24,21)"><rect y="0" width="20" height="2"/><rect y="6" width="20" height="2"/><rect y="12" width="20" height="2"/></svg>
                </a>
              </div>
              {/* Search bar */}
              <div className="absolute top-[50px] right-[200px]">
                <div className="w-[335px] h-[31px] border border-[rgb(224,224,224)] rounded-[3px] flex items-center px-[10px]">
                  <span className="text-[12px] text-[rgb(153,153,153)]">キーワードで探す</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* PC Navigation */}
        <div className="hidden md:block px-[80px]">
          <div className="max-w-[1440px] mx-auto pt-[60px] pb-[40px]">
            <nav className="flex items-center justify-between">
              {[
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
              ].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-[13px] font-medium text-[rgb(35,24,21)] hover:opacity-70 whitespace-nowrap"
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>
        </div>
        {/* SP Header */}
        <div className="block md:hidden px-[20px]">
          <div className="h-[60px] flex items-center justify-center relative">
            <a href="#">
              <img
                src="/assets/orbis/img-logo.png"
                alt="ORBIS"
                className="w-[94px] h-[24px]"
              />
            </a>
            <div className="absolute right-0 top-0 flex h-[60px]">
              <button className="w-[52px] h-[60px] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
              <button className="w-[52px] h-[60px] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 15" fill="rgb(35,24,21)"><rect y="0" width="20" height="2"/><rect y="6" width="20" height="2"/><rect y="12" width="20" height="2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== MAIN ===== */}
      <main className="pt-[60px] md:pt-0">
        {/* Login Banner */}
        <div className="bg-[rgb(242,242,242)] text-center">
          <a
            href="#"
            className="block text-[14px] font-semibold text-[rgb(51,51,51)] py-[7px] px-[5px]"
          >
            オルビス会員の方 ログインはこちら
          </a>
        </div>

        {/* ===== KEY VISUAL / HERO ===== */}
        <div className="relative border-b border-[rgb(224,224,224)] mb-[80px] md:mb-[80px]">
          <div className="max-w-[1440px] mx-auto relative overflow-hidden aspect-[390/478] md:aspect-auto md:h-[467px]">
            <img
              src="/assets/orbis/img-top-kv-item-first-F0.png"
              alt="Key Visual"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Dots */}
          <ul className="flex justify-center gap-[12px] py-[5px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i}>
                <button
                  className={`w-[8px] h-[8px] rounded-full ${
                    i === 1
                      ? "bg-[rgb(35,24,21)]"
                      : "bg-[rgb(200,200,200)]"
                  }`}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* ===== MOVIE AREA / CTA BANNER ===== */}
        <div className="mt-[60px] md:mt-[20px] mb-[50px] md:mb-[160px]">
          <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px]">
            <div className="max-w-[800px] mx-auto">
              <img
                src="/assets/orbis/cleansing_cta_pc_03.png"
                alt="Cleansing CTA"
                className="w-full h-auto aspect-[350/225] md:aspect-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* ===== FIRST ORDER ANCHOR SECTION ===== */}
        <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px]">
          <div>
            {/* Skincare Set Anchor */}
            <div className="mb-[40px] md:mb-[135px]">
              <div className="text-center md:text-left">
                <span className="block bg-[rgb(157,135,53)] text-white text-[12px] md:text-[20px] font-normal px-[18px] py-[7px] md:py-[10px] rounded-[30px] tracking-[0.8px] mb-[20px] md:mb-[20px] text-center w-fit mx-auto md:mx-0 leading-[20px]">
                  初めての方限定
                </span>
                <span className="block text-[35px] md:text-[60px] font-light text-[rgb(157,135,53)] tracking-[2.8px] md:tracking-[3.6px] leading-[35px] md:leading-[60px]" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                  SKIN CARE SET
                </span>
              </div>
              {/* Price image */}
              <div className="mt-[20px] md:mt-[30px] mb-[30px] text-center">
                <img
                  src="/assets/orbis/img-skin-care-price-01.png"
                  alt="Price"
                  className="w-auto h-[38px] mx-auto md:mx-0"
                />
              </div>
              {/* Skincare Set Grid */}
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-[16px] md:gap-x-[24px] md:gap-y-[30px]">
                {[
                  { img: "img-icon-skin-care-set-02.png", title: "最高峰エイジングケア", desc: "シミも乾燥も結果主義にこだわる" },
                  { img: "img-icon-skin-care-set-01.png", title: "徹底うるおいケア", desc: "肌の揺らぎが気になる方の" },
                  { img: "img-icon-skin-care-set-03.png", title: "薬用ニキビケア", desc: "子供も大人も、くり返しニキビのための" },
                  { img: "img-icon-skin-care-set-04.png", title: "男性用スキンケア", desc: "テカりに悩む方に清潔感を科学した" },
                  { img: "img-icon-skin-care-set-05.png", title: "高機能オールインワン", desc: "シミもシワもこれひとつでケアする" },
                ].map((item, i) => (
                  <li key={i} className="bg-white rounded-[4px] overflow-hidden">
                    <a href="#" className="flex items-center gap-[16px] p-[16px] md:p-[20px]">
                      <img
                        src={`/assets/orbis/${item.img}`}
                        alt={item.title}
                        className="w-[80px] md:w-[110px] h-auto flex-shrink-0"
                      />
                      <span className="flex-1">
                        <span className="block text-[14px] md:text-[26px] font-bold md:font-medium leading-[1.5] md:leading-[39px]">{item.title}</span>
                        <span className="block text-[12px] md:text-[15px] text-[rgb(102,102,102)] md:text-[rgb(35,24,21)] leading-[1.5] mt-[4px]">{item.desc}</span>
                      </span>
                      <span className="text-[rgb(200,200,200)] text-[20px] flex-shrink-0">›</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular Item Anchor */}
            <div className="flex flex-col md:flex-row gap-[30px] md:gap-[40px] mb-[80px]">
              <div>
                <span className="block bg-[rgb(239,133,125)] text-white text-[12px] md:text-[20px] font-normal px-[18px] py-[7px] md:py-[10px] rounded-[30px] tracking-[0.8px] mb-[20px] md:mb-[20px] text-center w-fit leading-[20px]">
                  初めての方限定
                </span>
                <span className="block text-[35px] md:text-[60px] font-light text-[rgb(239,133,125)] tracking-[2.1px] md:tracking-[4.8px] leading-[35px] md:leading-[60px]" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                  POPULAR ITEM
                </span>
                <div className="mt-[10px]">
                  <img
                    src="/assets/orbis/img-popular-item-benefit.png"
                    alt="Benefit"
                    className="h-[24px] md:h-[34px] w-auto"
                  />
                </div>
              </div>
              <a href="#" className="block flex-1">
                <img
                  src="/assets/orbis/img-popular-item-btn.png"
                  alt="Popular Item CTA"
                  className="w-full h-auto aspect-[350/165] md:aspect-auto object-cover"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Spacer: first-order → skincareset (source gap 240px) */}
        <div className="hidden md:block h-[160px]" />

        {/* ===== SKINCARE SET CONTENT ===== */}
        <section className="bg-[rgba(130,100,0,0.05)] md:bg-[rgba(130,100,0,0.05)] py-[33px] md:py-[58px] pb-[80px] md:pb-[150px] relative mt-0 md:mt-0">
          <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px]">
            {/* Title */}
            <h2 className="text-center mb-[30px]">
              <span className="block bg-[rgb(157,135,53)] text-white text-[12px] md:text-[20px] font-normal px-[18px] py-[7px] md:py-[10px] rounded-[30px] tracking-[0.8px] mb-[20px] text-center w-fit mx-auto leading-[20px]">
                初めての方限定
              </span>
              <span className="block text-[35px] md:text-[60px] font-light text-[rgb(157,135,53)] tracking-[2.8px] md:tracking-[3.6px] leading-[35px] md:leading-[60px]" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                SKIN CARE SET
              </span>
            </h2>
            {/* Price */}
            <div className="text-center mb-[50px] md:mb-[76px]">
              <img
                src="/assets/orbis/img-skin-care-price-02.png"
                alt="Price"
                className="w-auto h-[37px] md:h-[37px] mx-auto"
              />
            </div>
            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-[24px] gap-y-[50px] md:gap-x-[25px] md:gap-y-[50px]">
              {[
                "img-skin-care-set-banner-01.png",
                "img-skin-care-set-banner-02.png",
                "img-skin-care-set-banner-03.png",
                "img-skin-care-set-banner-04.png",
                "img-skin-care-set-banner-05.png",
              ].map((img, i) => (
                <div key={i} className="bg-white">
                  <a href="#">
                    <img
                      src={`/assets/orbis/${img}`}
                      alt={`Skincare Set ${i + 1}`}
                      className="w-full h-auto"
                    />
                  </a>
                  <div className="flex gap-[8px] p-[12px]">
                    <button className="flex-1 border border-[rgb(92,90,90)] text-[13px] md:text-[14px] py-[14px] text-center">
                      商品詳細
                    </button>
                    <button className="flex-1 bg-[rgb(92,90,90)] text-white text-[13px] md:text-[14px] py-[14px] text-center">
                      購入する
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== POPULAR ITEM CONTENT ===== */}
        <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px] py-[80px] md:py-[150px]">
          <section className="relative">
            <h2 className="text-center mb-[30px] md:mb-[43px]">
              <span className="block bg-[rgb(239,133,125)] text-white text-[12px] md:text-[20px] font-normal px-[18px] py-[7px] md:py-[10px] rounded-[30px] tracking-[0.8px] mb-[20px] text-center w-fit mx-auto leading-[20px]">
                初めての方限定
              </span>
              <span className="block text-[35px] md:text-[60px] font-light text-[rgb(239,133,125)] tracking-[2.1px] md:tracking-[3.6px] leading-[35px] md:leading-[60px]" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                POPULAR ITEM
              </span>
            </h2>
            <div className="text-center mb-[40px] md:mb-[76px]">
              <img
                src="/assets/orbis/img-popular-item-lead.png"
                alt="Lead"
                className="w-auto h-[33px] mx-auto"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px] md:gap-x-[25px] md:gap-y-[40px]">
              {[
                "img-popular-item-banner-01.png",
                "img-popular-item-banner-02.png",
                "img-popular-item-banner-03.png",
              ].map((img, i) => (
                <div key={i}>
                  <a href="#">
                    <img
                      src={`/assets/orbis/${img}`}
                      alt={`Popular Item ${i + 1}`}
                      className="w-full h-auto"
                    />
                  </a>
                  <div className="flex gap-[8px] mt-[36px]">
                    <button className="flex-1 border border-[rgb(92,90,90)] text-[13px] md:text-[14px] py-[12px] text-center">
                      商品詳細
                    </button>
                    <button className="flex-1 bg-[rgb(92,90,90)] text-white text-[13px] md:text-[14px] py-[12px] text-center">
                      購入する
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ===== INCENTIVE / BONUS ===== */}
        <div className="bg-[rgb(252,247,245)] pt-[30px] md:pt-[60px] pb-[20px]">
          <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px]">
            <p className="max-w-[800px] mx-auto bg-white text-center pt-[20px] pb-[0px] px-[20px] text-[20px] md:text-[32px] font-medium mb-[0px] leading-[28px] md:leading-[44.8px]">
              <span className="inline md:block text-[16px] md:text-[24px] font-medium mb-[8px]">初めての購入で嬉しい特典</span>
              3つのお得なサービス
            </p>
            <a href="#" className="block">
              <div className="flex max-w-[800px] mx-auto">
                <div className="flex-1">
                  <img src="/assets/orbis/img-incentive-01_202108.png" alt="送料無料" className="w-full h-auto" />
                </div>
                <div className="flex-1">
                  <img src="/assets/orbis/img-incentive-02_202108.png" alt="30日以内返品OK" className="w-full h-auto" />
                </div>
                <div className="flex-1">
                  <img src="/assets/orbis/img-incentive-03_20230522.png" alt="サンプルプレゼント" className="w-full h-auto" />
                </div>
              </div>
            </a>
            <ul className="mt-[10px]">
              <li className="text-[12px] text-[rgb(35,24,21)]">2回目以降は3,300円（税込）以上のご購入で送料無料</li>
            </ul>
            <a href="#" className="block mt-[10px]">
              <div className="max-w-[1080px] mx-auto pt-[10px]">
                <span className="inline-block border-b border-[rgb(35,24,21)] text-[14px] md:text-[16px] font-medium py-[5px]">
                  オルビスが初めての方へ
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* Spacer: bonus → trend (source gap 180px) */}
        <div className="hidden md:block h-[100px]" />

        {/* ===== TREND ITEM ===== */}
        <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px] py-[60px] md:py-[80px] mt-[60px] md:mt-0">
          <section className="mb-0 md:mb-[60px]">
            <h2 className="text-center mb-[30px] md:mb-[40px]">
              <span className="block text-[24px] md:text-[32px] font-light leading-[1.2]" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                TREND ITEM
              </span>
              <span className="block text-[14px] md:text-[14px] mt-[8px]">
                新商品や季節ごとのマストバイアイテムをご紹介
              </span>
            </h2>
            <div className="flex flex-wrap gap-x-[16px] gap-y-[30px] md:flex-nowrap md:justify-between md:overflow-x-auto pb-[10px]">
              {[
                { img: "top_new_top_recommend_item_400x400_udotset_20250820.jpg", title: "スキンケアで肌変化を体感！ 肌周期ぴったりサイズ", name: "オルビスユー ドット 1か月分化粧水たっぷり体験セット" },
                { img: "top_new_top_recommend_item_400x400_defencera.jpg", title: "全身の乾燥にアプローチ スキンケアを超えるインナーケア", name: "オルビス ディフェンセラ" },
                { img: "top_new_top_recommend_item_400x400_ad-brightningserum_260201.jpg", title: "メラニンの蓄積を抑えてシミを予防 シミ悩みから解き放つ美白美容液", name: "アドバンスド ブライトニング セラム" },
                { img: "top_new_top_recommend_item_400x400_wrinkleserum2026_0101.jpg", title: "ナイアシンアミドが素早く浸透！ シワ改善+美白美容液", name: "オルビス ザ リンクルセラム" },
                { img: "top_new_top_recommend_item_400x400_maskfandation250220.jpg", title: "\"つるピタ\"カバーで大人ツヤ肌 毛穴レスリキッドファンデ", name: "オルビスユー カラースキンケアマスクファンデーション" },
                { img: "top_new_top_recommend_item_400x400_treatmentprimer.jpg", title: "毛穴・小ジワを速攻カバー！ UVカットも叶える高機能下地", name: "オルビスユー トリートメントプライマー" },
              ].map((item, i) => (
                <a key={i} href="#" className="flex-shrink-0 w-[calc((100%-32px)/3)] md:w-[174px] md:py-[10px]">
                  <img
                    src={`/assets/orbis/${item.img}`}
                    alt={item.name}
                    className="w-full h-auto"
                  />
                  <div className="text-[14px] md:text-[14px] mt-[8px] leading-[21px] md:leading-[25.2px] font-bold text-[rgb(35,24,21)]">{item.title}</div>
                  <p className="text-[14px] md:text-[14px] mt-[4px] leading-[21.6px] md:leading-[23.4px] mb-[6px] md:mb-[6px]">{item.name}</p>
                </a>
              ))}
            </div>
          </section>

          {/* CONTENTS */}
          <section>
            <h2 className="text-center mb-[30px] md:mb-[40px]">
              <span className="block text-[24px] md:text-[32px] font-light leading-[1.2]" style={{ fontFamily: '"Open Sans", sans-serif' }}>
                CONTENTS
              </span>
              <span className="block text-[14px] mt-[8px]">
                あなたに合ったスキンケアやメイクをご提案
              </span>
            </h2>
            <div className="block md:grid md:grid-cols-2 md:gap-[22px]">
              {[
                { img: "top_new_contens01_664x200_20230720.jpg", text: "AI肌診断" },
                { img: "top_new_contens02_664x200_20230322.jpg", text: "パーソナルカラー診断" },
                { img: "top_new_contens03_664x200_20251216.jpg", text: "お悩み別スキンケア" },
                { img: "top_new_contens04_664x200_260219.jpg", text: "成分事典" },
              ].map((item, i) => (
                <a key={i} href="#" className="block mb-[20px] md:mb-0">
                  <img
                    src={`/assets/orbis/${item.img}`}
                    alt={item.text}
                    className="w-full h-auto rounded-[4px]"
                  />
                </a>
              ))}
            </div>
          </section>
        </div>

        {/* ===== LINEUP / CATEGORY ===== */}
        <section className="bg-[rgb(249,249,249)] pt-[1px] pb-[60px] mt-[20px] md:mt-[80px]">
          <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px]">
            {/* PC content */}
            <div className="hidden md:block">
              <h2 className="text-[28px] font-bold text-center mt-[80px] mb-[40px] leading-[28px]">
                商品を探す
              </h2>
              {/* Search form */}
              <div className="mb-[20px]">
                <div className="max-w-[560px] mx-auto flex">
                  <input
                    type="text"
                    placeholder="キーワード・商品番号を入力"
                    className="flex-1 border border-[rgb(224,224,224)] px-[16px] py-[10px] text-[14px] outline-none"
                    readOnly
                  />
                  <button className="bg-[rgb(35,24,21)] text-white px-[20px] py-[10px] text-[14px]">検索</button>
                </div>
              </div>
              {/* Tag cloud */}
              <div className="flex flex-wrap justify-center gap-[8px] mb-[60px]">
                {[
                  "#オルビス ~¥2000",
                  "#トリートメント ヘアケア",
                  "#リップ 保湿",
                  "#ファンデーション メイク",
                  "#毛穴 クレンジング",
                  "#カサカサ対策 ボディケア",
                  "#スペシャルケア 美容液",
                  "#アイメイク ~¥2000",
                  "#健康食品 ダイエット",
                ].map((tag) => (
                  <a key={tag} href="#" className="border border-[rgb(224,224,224)] bg-white rounded-full px-[16px] py-[6px] text-[13px]">
                    {tag}
                  </a>
                ))}
              </div>
              {/* Brand section */}
              <h3 className="text-[18px] font-bold mb-[20px] leading-[32.4px]">ブランド・シリーズから探す</h3>
              <div className="mb-[40px]">
                {/* Top 2 large brand cards */}
                <div className="flex gap-[20px] mb-[20px]">
                  {[
                    { img: "img-icon-skin-care-set-01.png", name: "オルビスユー", desc: "みずみずしく光を跳ね返す透明感", tags: ["スキンケア", "スペシャルケア", "メイク"] },
                    { img: "img-icon-skin-care-set-02.png", name: "オルビスユー ドット", desc: "最高峰エイジングケア", tags: ["スキンケア"] },
                  ].map((brand, i) => (
                    <a key={i} href="#" className="flex-1 flex items-center gap-[20px] bg-white rounded-[8px] md:rounded-none p-[16px] md:p-[20px]">
                      <img src={`/assets/orbis/${brand.img}`} alt={brand.name} className="w-[172px] h-[172px] object-contain" />
                      <div>
                        <h4 className="text-[16px] font-bold mb-[8px]">{brand.name}</h4>
                        <p className="text-[13px] text-[rgb(102,102,102)] mb-[8px]">{brand.desc}</p>
                        <div className="flex gap-[6px]">
                          {brand.tags.map((t) => (
                            <span key={t} className="text-[11px] border border-[rgb(224,224,224)] px-[8px] py-[2px] rounded-full">{t}</span>
                          ))}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
                {/* Smaller brand cards grid */}
                <div className="grid grid-cols-4 gap-[12px]">
                  {[
                    "クリアフル", "オルビスブライト", "オルビス アクアニスト", "オルビスアンバー",
                    "オルビスユーアンコール", "オルビスユーホワイト", "オルビスミスター", "クリーンエンス",
                    "ヘレナス", "リンクルシリーズ",
                  ].map((name) => (
                    <a key={name} href="#" className="flex items-center gap-[12px] bg-white rounded-[8px] md:rounded-none p-[12px] md:p-0">
                      <div className="w-[80px] h-[80px] bg-[rgb(245,245,245)] rounded-full flex-shrink-0" />
                      <span className="text-[13px] font-medium">{name}</span>
                    </a>
                  ))}
                </div>
              </div>
              {/* Category tabs */}
              <h3 className="text-[18px] font-bold mb-[20px] leading-[32.4px]">カテゴリから探す</h3>
              <div className="flex gap-[4px] mb-[40px]">
                {[
                  { img: "img-icon-category-02.jpg", name: "スキンケア" },
                  { img: "img-icon-category-09.jpg", name: "メイク" },
                  { img: "img-icon-category-11.jpg", name: "ヘア&ボディケア" },
                  { img: "img-icon-category-28.jpg", name: "インナーケア・食品" },
                  { img: "img-icon-category-33.jpg", name: "ボディウェア" },
                ].map((cat, i) => (
                  <a key={i} href="#" className={`flex-1 flex flex-col items-center gap-[8px] py-[12px] rounded-t-[8px] md:rounded-none text-[13px] ${i === 0 ? "bg-white border-b-2 border-[rgb(35,24,21)] font-bold" : "bg-[rgb(240,240,240)]"}`}>
                    <img src={`/assets/orbis/${cat.img}`} alt={cat.name} className="w-[40px] h-[40px] rounded-full" />
                    {cat.name}
                  </a>
                ))}
              </div>
              {/* Purpose links */}
              <h3 className="text-[18px] font-bold mb-[20px] leading-[32.4px]">お悩み・目的から探す</h3>
              <div className="flex flex-wrap gap-[10px] mb-[40px]">
                {["エイジングケア", "シミ・そばかす・美白", "毛穴", "ニキビ", "テカリ・べたつき", "シワ改善", "乾燥・ハリ低下", "くすみ・クマ", "敏感肌"].map((item) => (
                  <a key={item} href="#" className="flex items-center gap-[8px] bg-white border border-[rgb(224,224,224)] rounded-[8px] md:rounded-none px-[16px] py-[14px] md:py-[10px] text-[14px] font-bold w-[214px]">
                    {item}
                    <span className="ml-auto text-[rgb(200,200,200)]">›</span>
                  </a>
                ))}
              </div>
              {/* Best cosmetics banner */}
              <div>
                <h3 className="text-[20px] font-bold mb-[12px]">ベストコスメ受賞アイテム</h3>
                <a href="#" className="block">
                  <img src="/assets/orbis/PC_bestcosmeCP_TOP_1440bnr_top.png" alt="ベストコスメ受賞アイテム" className="w-full h-auto" />
                </a>
              </div>
            </div>
            {/* SP content */}
            <div className="block md:hidden">
              <h2 className="text-[20px] font-bold text-center mt-[40px] mb-[30px]">
                カテゴリーから探す
              </h2>
              <div className="grid grid-cols-3 gap-[12px]">
                {[
                  { img: "img-icon-category-02.jpg", name: "スキンケア" },
                  { img: "img-icon-category-03.jpg", name: "クレンジング・洗顔" },
                  { img: "img-icon-category-04.jpg", name: "化粧水・ローション" },
                  { img: "img-icon-category-05.jpg", name: "美容液・オイル" },
                  { img: "img-icon-category-06.jpg", name: "乳液・クリーム" },
                  { img: "img-icon-category-08.jpg", name: "日焼け止め・UV" },
                  { img: "img-icon-category-09.jpg", name: "ベースメイク" },
                  { img: "img-icon-category-10.jpg", name: "ポイントメイク" },
                  { img: "img-icon-category-11.jpg", name: "ヘアケア" },
                  { img: "img-icon-category-13.jpg", name: "ボディケア" },
                  { img: "img-icon-category-12.jpg", name: "メンズ" },
                  { img: "img-icon-category-28.jpg", name: "インナーケア" },
                ].map((item, i) => (
                  <a key={i} href="#" className="block text-center">
                    <img src={`/assets/orbis/${item.img}`} alt={item.name} className="w-full h-auto rounded-full" />
                    <p className="text-[11px] mt-[8px]">{item.name}</p>
                  </a>
                ))}
              </div>
              <div className="mt-[40px]">
                <h3 className="text-[16px] font-bold text-center mb-[20px]">目的から探す</h3>
                <div className="flex flex-wrap justify-center gap-[8px]">
                  {["エイジングケア", "美白ケア", "ニキビケア", "毛穴ケア", "乾燥ケア", "敏感肌ケア"].map((item) => (
                    <a key={item} href="#" className="border border-[rgb(224,224,224)] bg-white rounded-full px-[16px] py-[8px] text-[12px]">
                      {item}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== RANKING ===== */}
        <div className="bg-[rgb(250,248,239)] md:py-[80px]">
          <div className="max-w-[1440px] mx-auto pt-[1px] px-[20px] pb-[20px] md:pt-0 md:pb-0 md:px-[80px]">
            <h2 className="text-[20px] md:text-[28px] font-bold text-center mt-[50px] mb-[20px] md:mt-0 md:mb-[30px] md:leading-[28px]">
              ランキング
            </h2>
            <ul className="flex flex-wrap justify-center mt-[30px] mb-[10px] md:mt-0 md:mb-[20px]">
              {["総合", "スキンケア", "メイク", "ボディ", "ヘアケア", "メンズ"].map((tab, i) => (
                <li key={tab} className="m-[5px] mt-[10px] mb-[12px] md:m-0">
                  <button
                    className={`px-[15px] py-[7px] rounded-full text-[13px] border ${
                      i === 0
                        ? "bg-[rgb(152,114,61)] text-white border-[rgb(152,114,61)]"
                        : "bg-white border-[rgb(224,224,224)]"
                    }`}
                  >
                    {tab}
                  </button>
                </li>
              ))}
            </ul>
            {/* Ranking items */}
            <div className="flex flex-wrap gap-x-[10px] gap-y-[30px] md:flex-nowrap md:gap-[16px] md:overflow-x-auto pb-[10px]">
              {[
                { img: "1161023_300.jpg", rank: 1, name: "オルビスユー ローション", price: "税込2,970円" },
                { img: "11010380_300.jpg", rank: 2, name: "オルビス クリアフル ウォッシュ", price: "税込1,430円" },
                { img: "11010750_300.jpg", rank: 3, name: "オルビスユー ドット ローション", price: "税込3,630円" },
                { img: "1201050_300.jpg", rank: 4, name: "クレンジングリキッド", price: "税込1,467円" },
                { img: "1253036_300.jpg", rank: 5, name: "オルビスユー セラム", price: "税込3,850円" },
                { img: "1161023_300.jpg", rank: 6, name: "オルビスユー モイスチャー", price: "税込2,970円" },
              ].map((item) => (
                <a key={item.rank} href="#" className="flex flex-col items-center py-[10px] md:py-0 flex-shrink-0 w-[calc((100%-20px)/3)] md:w-[172px]">
                  <div className="relative mb-[18px] md:mb-0">
                    <span className="absolute top-0 left-0 bg-[rgb(35,24,21)] text-white w-[24px] h-[24px] flex items-center justify-center text-[12px] font-bold z-10">
                      {item.rank}
                    </span>
                    <img
                      src={`/assets/orbis/${item.img}`}
                      alt={item.name}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="pt-[5px]">
                    <p className="text-[12px] md:text-[16px] mt-[4px] leading-[1.5]">{item.name}</p>
                    <p className="text-[11px] md:text-[13px] text-[rgb(102,102,102)] mt-[4px]">{item.price}</p>
                  </div>
                </a>
              ))}
            </div>
            <div className="text-center mt-[50px]">
              <a href="#" className="inline-block border border-[rgb(92,90,90)] bg-white px-[60px] py-[14px] text-[14px]">
                ランキングをもっと見る
              </a>
            </div>
          </div>
        </div>

        {/* ===== NEW ITEM ===== */}
        <div className="bg-[rgb(247,250,255)] py-[50px] md:py-[80px]">
          <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px]">
            <h2 className="text-[20px] md:text-[28px] font-bold text-center mb-[30px] md:leading-[28px] relative">
              新商品
              <span className="block text-[14px] md:text-[16px] font-bold text-[rgb(221,81,71)] mt-[4px]">NEW</span>
            </h2>
            <div className="flex gap-[10px] overflow-x-auto md:gap-[16px] pb-[10px]">
              {[
                { img: "top_new_top_recommend_item_400x400_udotset_20250820.jpg", desc: "肌変化を体感するエイジングケア", name: "オルビスユー ドット トライアルセット" },
                { img: "top_new_top_recommend_item_400x400_ad-brightningserum_260201.jpg", desc: "シミを予防する美白美容液", name: "AD ブライトニングセラム" },
                { img: "top_new_top_recommend_item_400x400_wrinkleserum2026_0101.jpg", desc: "シワ改善+美白の薬用美容液", name: "リンクルホワイトセラム" },
                { img: "top_new_top_recommend_item_400x400_maskfandation250220.jpg", desc: "毛穴レスな大人ツヤ肌ファンデ", name: "エッセンスグロウファンデーション" },
                { img: "top_new_top_recommend_item_400x400_treatmentprimer.jpg", desc: "毛穴・小ジワをカバーする下地", name: "スキンフィット トリートメントプライマー" },
                { img: "top_new_top_recommend_item_400x400_defencera.jpg", desc: "飲むスキンケアで全身うるおう", name: "オルビス ディフェンセラ" },
                { img: "1161023_300.jpg", desc: "肌環境を整えるエイジングケア", name: "オルビスユー ローション" },
                { img: "11010750_300.jpg", desc: "ハリ肌を目指す高保湿ケア", name: "オルビスユー ドット ローション" },
                { img: "1253036_300.jpg", desc: "先行型美容液で肌を整える", name: "オルビスユー セラム" },
                { img: "1201050_300.jpg", desc: "オイルフリーで毛穴すっきり", name: "クレンジングリキッド" },
              ].map((item, i) => (
                <a key={i} href="#" className="flex-shrink-0 w-[135px] md:w-[196px]">
                  <img
                    src={`/assets/orbis/${item.img}`}
                    alt={item.name}
                    className="w-full h-auto rounded-[4px]"
                  />
                  <div className="pt-[5px]">
                    <p className="text-[14px] md:text-[18px] mt-[4px] md:mt-[10px] leading-[1.5] md:leading-[27px] font-medium md:font-bold">{item.desc}</p>
                    <p className="text-[12px] md:text-[16px] mt-[4px] leading-[1.5]">{item.name}</p>
                  </div>
                </a>
              ))}
            </div>
            <div className="text-center mt-[50px]">
              <a href="#" className="inline-block border border-[rgb(92,90,90)] bg-white px-[60px] py-[14px] text-[14px]">
                新商品をもっと見る
              </a>
            </div>
          </div>
        </div>

        {/* ===== FEATURE ===== */}
        <div className="bg-[rgb(255,241,240)] py-[50px] md:py-[80px] mt-[70px] md:mt-[113px]">
          <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px]">
            <h2 className="text-[20px] md:text-[28px] font-bold text-center mb-[30px] md:mb-[40px] -mt-[65px] md:mt-0 md:leading-[28px]">
              特集
            </h2>
            <div className="grid grid-cols-2 gap-[10px] md:flex md:gap-[16px] md:overflow-x-auto pb-[10px] mt-[40px] md:mt-0">
              {[
                { img: "00002486_eye_catch__thumb.jpg", title: "春のスキンケア特集" },
                { img: "00002552_eye_catch__thumb.jpg", title: "UV対策特集" },
                { img: "00002608_eye_catch__thumb.jpg", title: "美白ケア特集" },
                { img: "00002594_eye_catch__thumb.jpg", title: "エイジングケア特集" },
              ].map((item, i) => (
                <a key={i} href="#" className="w-full md:flex-shrink-0 md:w-[260px]">
                  <img
                    src={`/assets/orbis/${item.img}`}
                    alt={item.title}
                    className="w-full aspect-square object-cover rounded-[4px]"
                  />
                  <span className="block text-[12px] md:text-[14px] mt-[8px] p-[10px] md:p-0 font-normal md:font-medium leading-[18px] md:leading-[25.2px]">{item.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ===== BEST SELLER & CATEGORIES ===== */}
        <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px] py-[50px] md:py-[40px] mt-[50px] md:mt-[80px]">
          <h2 className="text-[20px] md:text-[28px] font-bold text-center mb-[30px] md:mb-[40px] md:leading-[28px]">
            ベストセラー＆ 人気カテゴリー
          </h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-[16px] md:gap-[20px]">
            {[
              { img: "PC-bestseller-orbisU-453_182.png", name: "オルビスユーシリーズ" },
              { img: "PC-bestseller-Udot-453_182new.png", name: "オルビスユー ドットシリーズ" },
              { img: "PC-bestseller-haircare-453_182.png", name: "エッセンスインヘアミルク" },
              { img: "PC-bestseller-clearful-453_182.png", name: "クリアフルシリーズ" },
              { img: "PC-bestseller-three-serum-453_182.png", name: "オルビスの美容液" },
              { img: "PC-BestSeller_cleansing_435_182_1.png", name: "クレンジングリキッド" },
              { img: "PC-bestseller-Mr-453_182.png", name: "オルビスミスター" },
              { img: "PC-bestseller-uv-453_182.png", name: "オルビスのUVカット" },
              { img: "PC-bestseller-basemake-453_182.png", name: "オルビスのベースメイク" },
            ].map((item, i) => (
              <li key={i} className="list-none">
                <a href="#" className="block">
                  <img
                    src={`/assets/orbis/${item.img}`}
                    alt={item.name}
                    className="w-full h-auto"
                  />
                  <span className="block text-[13px] md:text-[14px] mt-[8px] md:font-bold">{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* ===== BRAND / ABOUT ===== */}
        <div
          className="h-[480px] bg-cover bg-center relative mt-[40px] md:mt-[50px]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.4))",
          }}
        >
          <div className="flex items-center justify-center h-full bg-[rgba(255,255,255,0.4)]">
            <div className="text-center max-w-[800px] mx-auto px-[20px]">
              <p className="text-[14px] md:text-[14px] leading-[2] mb-[24px]">
                ORBISは、肌が本来持つ力を信じて、<br />
                科学に基づいたスキンケアを提案します。<br />
                「肌に自信を。あなたに自由を。」
              </p>
              <a href="#" className="inline-block border border-[rgb(35,24,21)] px-[40px] py-[12px] text-[14px]">
                ブランドについて
              </a>
            </div>
          </div>
        </div>

        {/* ===== SERVICE ===== */}
        <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px] pt-[50px] md:pt-[40px] pb-[50px] md:pb-[100px] mt-[50px] md:mt-[80px]">
          <h2 className="text-[20px] md:text-[28px] font-bold text-center mb-[30px] md:mb-[40px] md:leading-[28px]">
            サービス
          </h2>
          <div className="flex gap-[16px] overflow-x-auto md:gap-[20px] pb-[10px]">
            {[
              { img: "img-icon-information-01.png", title: "ポイントサービス", desc: "お買い物でポイントが貯まる・使える" },
              { img: "img-icon-information-02.png", title: "定期お届けプログラム", desc: "定期購入でお得にお買い物" },
              { img: "img-icon-information-03.png", title: "送料・お届けについて", desc: "税込3,300円以上のご注文で送料無料" },
            ].map((item, i) => (
              <a key={i} href="#" className="flex-shrink-0 w-[280px] md:flex-1 md:w-auto text-center">
                <div className="w-[120px] md:w-[192px] h-[120px] md:h-[192px] mx-auto mb-[16px] bg-[rgb(249,249,249)] rounded-full flex items-center justify-center">
                  <img src={`/assets/orbis/${item.img}`} alt={item.title} className="w-[60px] md:w-[72px] h-auto" />
                </div>
                <h3 className="text-[14px] md:text-[16px] font-bold mb-[8px]">{item.title}</h3>
                <p className="text-[12px] md:text-[13px] text-[rgb(102,102,102)]">{item.desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* ===== NEWS / INFORMATION ===== */}
        <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px] py-[50px] md:py-[40px] mt-[51px] md:mt-[80px]">
          <section className="mb-[40px]">
            <h2 className="text-[20px] md:text-[28px] font-bold text-center mb-[30px] md:mb-[40px] md:leading-[28px]">
              お知らせ
            </h2>
            <ul className="divide-y divide-[rgb(224,224,224)] border-t border-b border-[rgb(224,224,224)] md:mt-[20px] md:mb-[20px]">
              {[
                { date: "2026.03.01", text: "春の新商品が発売開始" },
                { date: "2026.02.15", text: "期間限定キャンペーンのお知らせ" },
                { date: "2026.02.01", text: "オルビスユー リニューアルのお知らせ" },
                { date: "2026.01.15", text: "年末年始の営業・配送スケジュールについて" },
              ].map((item, i) => (
                <li key={i}>
                  <a href="#" className="flex gap-[16px] md:gap-[24px] py-[16px] md:py-[20px]">
                    <span className="text-[12px] md:text-[14px] text-[rgb(153,153,153)] whitespace-nowrap">{item.date}</span>
                    <span className="text-[13px] md:text-[14px]">{item.text}</span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="text-center mt-[20px]">
              <a href="#" className="inline-block border border-[rgb(92,90,90)] bg-white px-[60px] py-[14px] text-[14px]">
                お知らせ一覧
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-[20px] md:text-[28px] font-bold text-center mb-[30px] md:mt-[80px] md:leading-[28px]">
              読みもの
            </h2>
            <ul className="divide-y divide-[rgb(224,224,224)] border-t border-b border-[rgb(224,224,224)]">
              {[
                { date: "2026.02.20", text: "正しいクレンジングの選び方" },
                { date: "2026.02.10", text: "春のゆらぎ肌対策" },
              ].map((item, i) => (
                <li key={i}>
                  <a href="#" className="flex gap-[16px] md:gap-[24px] py-[16px] md:py-[20px]">
                    <span className="text-[12px] md:text-[14px] text-[rgb(153,153,153)] whitespace-nowrap">{item.date}</span>
                    <span className="text-[13px] md:text-[14px]">{item.text}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      {/* ===== PAGE TOP ===== */}
      <div className="text-center py-[20px] md:py-[20px]">
        <a
          href="#"
          className="text-[12px] text-[rgb(153,153,153)]"
        >
          ▲ PAGE TOP
        </a>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[rgb(250,250,250)]">
        {/* Information Block */}
        <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px] pt-[40px] md:pt-[80px]">
          <div className="flex flex-col md:flex-row gap-[24px] md:gap-[40px] border border-[rgb(224,224,224)] p-[20px] md:p-[30px] mb-[60px]">
            {/* Left: 4-icon info grid */}
            <div className="flex-1 md:flex-[2]">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-[20px] md:gap-[24px]">
                {[
                  { img: "img-icon-information-01.png", title: "送料無料", desc: "初めての方は、全国送料無料、2回目以降のご利用の方は、3,300円以上(税込)のお買い上げで、送料無料" },
                  { img: "img-icon-information-02.png", title: "30日以内なら返品OK", desc: "開封後でも発送日から30日以内であれば返品可能 ※商品返送料はオルビスが負担いたします" },
                  { img: "img-icon-information-03.png", title: "最短ご注文翌日お届け", desc: "一部地域を除き、最短でご注文の翌日にお届けいたします" },
                  { img: "img-icon-information-04.png", title: "サンプルプレゼント", desc: "サンプルはご注文商品の合計個数までお選びいただけます" },
                ].map((item, i) => (
                  <li key={i} className="flex gap-[16px]">
                    <img src={`/assets/orbis/${item.img}`} alt={item.title} className="w-[72px] h-[72px] flex-shrink-0" />
                    <div>
                      <p className="text-[14px] font-bold mb-[4px]">{item.title}</p>
                      <p className="text-[12px] md:text-[14px] text-[rgb(102,102,102)] leading-[1.6] md:leading-[25.2px]">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-[16px]">
                <a href="#" className="text-[13px] text-[rgb(35,24,21)]">
                  詳しくはこちら <span className="ml-[4px]">›</span>
                </a>
              </div>
            </div>
            {/* Right: Contact info */}
            <div className="flex-1 border-t md:border-t-0 md:border-l border-[rgb(224,224,224)] pt-[20px] md:pt-0 md:pl-[40px]">
              <p className="text-[14px] md:text-[20px] font-bold mb-[12px]">お電話でのご注文・お問い合わせ</p>
              <p className="mb-[8px]">
                <span className="inline-block bg-[rgb(35,24,21)] text-white text-[11px] px-[8px] py-[2px] mr-[8px]">無料通話</span>
                <span className="text-[24px] md:text-[40px] font-bold">0120-010-010</span>
              </p>
              <ul className="mb-[16px]">
                <li className="text-[12px] text-[rgb(102,102,102)]">午前9時より午後7時まで</li>
              </ul>
              <div className="space-y-[8px]">
                <a href="#" className="block border border-[rgb(224,224,224)] text-center py-[10px] text-[13px]">
                  よくあるご質問・お問い合わせ <span className="ml-[4px]">›</span>
                </a>
                <a href="#" className="block border border-[rgb(224,224,224)] text-center py-[10px] text-[13px]">
                  ショッピングガイド <span className="ml-[4px]">›</span>
                </a>
              </div>
              <p className="text-[12px] md:text-[14px] text-[rgb(102,102,102)] mt-[16px] leading-[1.6] md:leading-[25.2px]">
                月末は混み合いますので お早めにご注文ください。<br />
                <span className="font-bold">平日のお昼前後が比較的つながりやすい時間帯です。</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-[rgb(224,224,224)]">
          <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px] py-[30px] md:pt-[60px] md:pb-[40px] md:text-center">
            {/* Action buttons */}
            <div className="flex flex-col gap-[20px] md:flex-row md:justify-center md:gap-[12px] mb-[40px]">
              <a href="#" className="border border-[rgb(224,224,224)] bg-white block text-center py-[10px] text-[13px]">商品番号から注文</a>
              <a href="#" className="border border-[rgb(224,224,224)] bg-white block text-center py-[10px] text-[13px]">無料サンプルを探す</a>
            </div>
            {/* Category links */}
            <ul className="flex flex-wrap justify-center gap-[24px] mb-[20px]">
              {["スキンケア", "メイク", "ヘア＆ボディ", "インナーケア（食品）", "ボディウェア"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-[14px]">{link}</a>
                </li>
              ))}
            </ul>
            {/* SNS & App */}
            <div className="flex flex-col gap-[40px] md:flex-row md:justify-center md:items-center md:gap-[20px] mb-[40px]">
              <div className="flex flex-col gap-[10px] md:flex-row md:items-center md:gap-[12px]">
                <span className="text-[12px] text-[rgb(102,102,102)]">ORBIS SNS公式アカウント</span>
                <div className="flex gap-[8px]">
                  {[
                    { img: "img-footer-facebook.png", alt: "Facebook" },
                    { img: "img-footer-twitter.png", alt: "Twitter" },
                    { img: "img-footer-line.png", alt: "LINE" },
                    { img: "img-footer-insta.png", alt: "Instagram" },
                  ].map((sns) => (
                    <a key={sns.alt} href="#"><img src={`/assets/orbis/${sns.img}`} alt={sns.alt} className="w-[40px] h-[40px]" /></a>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-[10px] md:flex-row md:items-center md:gap-[12px]">
                <div>
                  <span className="text-[12px] font-bold">ORBIS アプリ</span>
                  <span className="text-[12px] text-[rgb(102,102,102)] ml-[8px]">お買い物をもっと楽しく、便利に！</span>
                </div>
                <div className="flex gap-[8px]">
                  <a href="#"><img src="/assets/orbis/img-appstore.png" alt="App Store" className="h-[40px] w-auto" /></a>
                  <a href="#"><img src="/assets/orbis/img-google-play.png" alt="Google Play" className="h-[40px] w-auto" /></a>
                </div>
              </div>
            </div>
            {/* Legal links row 1 */}
            <ul className="flex flex-wrap gap-[16px] md:gap-[24px] mb-[8px]">
              {["会社案内TOP", "採用情報", "化粧品の使用上の注意について", "個人情報保護について", "特定商取引法に基づく表記"].map((link) => (
                <li key={link}><a href="#" className="text-[12px] text-[rgb(102,102,102)]">{link}</a></li>
              ))}
            </ul>
            {/* Legal links row 2 */}
            <ul className="flex flex-wrap gap-[16px] md:gap-[24px]">
              {["オンラインショップ利用規約", "Webコミュニティ利用規約", "ポイントサービス利用規約", "ソーシャルメディアポリシー", "ペンギンリング プロジェクト", "サイトマップ"].map((link) => (
                <li key={link}><a href="#" className="text-[12px] text-[rgb(102,102,102)]">{link}</a></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="border-t border-[rgb(224,224,224)]">
          <div className="max-w-[1440px] mx-auto px-[20px] md:px-[80px] py-[60px] md:py-[50px] text-center">
            <p className="text-[12px] text-[rgb(153,153,153)]">
              Copyright (c) 1999 - 2026 ORBIS Inc. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
