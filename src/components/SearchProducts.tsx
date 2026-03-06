"use client";

import { useState } from "react";

const tags = [
  { label: "#オルビス ～￥2000", href: "/itemlist/?tag=オルビス,～￥2000" },
  { label: "#トリートメント ヘアケア", href: "/itemlist/?tag=トリートメント,ヘアケア" },
  { label: "#リップ 保湿", href: "/itemlist/?tag=リップ,保湿" },
  { label: "#ファンデーション メイク", href: "/itemlist/?tag=ファンデーション,メイク" },
  { label: "#毛穴 クレンジング", href: "/itemlist/?tag=毛穴,クレンジング" },
  { label: "#カサカサ対策 ボディケア", href: "/itemlist/?tag=カサカサ対策,ボディケア" },
  { label: "#スペシャルケア 美容液", href: "/itemlist/?tag=スペシャルケア,美容液" },
  { label: "#アイメイク ～￥2000", href: "/itemlist/?tag=アイメイク,～￥2000" },
  { label: "#健康食品 ダイエット", href: "/itemlist/?tag=健康食品,ダイエット" },
];

type SeriesTagType = "skincare" | "special" | "make" | "bodycare" | "haircare" | "uv";

const seriesTagStyles: Record<SeriesTagType, string> = {
  skincare: "bg-[rgb(229,240,245)]",
  special: "bg-[rgb(236,233,250)]",
  make: "bg-[rgb(247,232,238)]",
  bodycare: "bg-[rgb(235,246,239)]",
  haircare: "bg-[rgb(235,246,239)]",
  uv: "bg-[rgb(247,249,225)]",
};

interface BrandItem {
  href: string;
  img: string;
  subTitle: string;
  title: string;
  tags: { type: SeriesTagType; label: string }[];
}

const brandsFeatured: BrandItem[] = [
  {
    href: "/mid/910/",
    img: "/assets/img-icon-category-01.jpg",
    subTitle: "みずみずしく光を跳ね返す透明感",
    title: "オルビスユー",
    tags: [
      { type: "skincare", label: "スキンケア" },
      { type: "special", label: "スペシャルケア" },
      { type: "make", label: "メイク" },
    ],
  },
  {
    href: "/mid/915/",
    img: "/assets/img-icon-category-02.jpg",
    subTitle: "最高峰エイジングケア",
    title: "オルビスユー ドット",
    tags: [{ type: "skincare", label: "スキンケア" }],
  },
];

const brandsGrid: BrandItem[] = [
  {
    href: "/mid/909/",
    img: "/assets/img-icon-category-04.jpg",
    subTitle: "ニキビ・肌荒れを防ぐ",
    title: "クリアフル",
    tags: [
      { type: "skincare", label: "スキンケア" },
      { type: "special", label: "スペシャルケア" },
      { type: "make", label: "メイク" },
      { type: "bodycare", label: "ボディケア" },
    ],
  },
  {
    href: "/mid/908/",
    img: "/assets/img-icon-category-05.jpg",
    subTitle: "シミ・ソバカスのお悩みに",
    title: "オルビスブライト",
    tags: [{ type: "skincare", label: "スキンケア" }],
  },
  {
    href: "/mid/917/",
    img: "/assets/img-icon-category-06.jpg",
    subTitle: "敏感肌用保湿スキンケア",
    title: "オルビス アクアニスト",
    tags: [{ type: "skincare", label: "スキンケア" }],
  },
  {
    href: "/mid/911/",
    img: "/assets/img-icon-category-08.jpg",
    subTitle: "賢くラクにエイジングケア",
    title: "オルビスアンバー",
    tags: [
      { type: "skincare", label: "スキンケア" },
      { type: "special", label: "スペシャルケア" },
    ],
  },
  {
    href: "/mid/903/",
    img: "/assets/img-icon-category-09.jpg",
    subTitle: "濃密保湿エイジングケア",
    title: "オルビスユーアンコール",
    tags: [{ type: "skincare", label: "スキンケア" }],
  },
  {
    href: "/mid/902/",
    img: "/assets/img-icon-category-10.jpg",
    subTitle: "大人のための美白ケア",
    title: "オルビスユーホワイト",
    tags: [
      { type: "skincare", label: "スキンケア" },
      { type: "special", label: "スペシャルケア" },
    ],
  },
  {
    href: "/mid/912/",
    img: "/assets/img-icon-category-11.jpg",
    subTitle: "メンズスキンケア＆メイク",
    title: "オルビスミスター",
    tags: [
      { type: "skincare", label: "スキンケア" },
      { type: "special", label: "スペシャルケア" },
      { type: "make", label: "メイク" },
      { type: "haircare", label: "ヘアケア" },
    ],
  },
  {
    href: "/mid/913/",
    img: "/assets/img-icon-category-13.jpg",
    subTitle: "肌にも環境にもいいことを",
    title: "クリーンエンス",
    tags: [
      { type: "skincare", label: "スキンケア" },
      { type: "special", label: "スペシャルケア" },
    ],
  },
  {
    href: "/mid/159/",
    img: "/assets/img-icon-category-12.jpg",
    subTitle: "自然ないい香りを引き出す",
    title: "ヘレナス",
    tags: [{ type: "bodycare", label: "ボディケア" }],
  },
  {
    href: "/mid/914/",
    img: "/assets/img-icon-category-03.jpg",
    subTitle: "シワ改善・美白のWケア",
    title: "リンクルシリーズ",
    tags: [
      { type: "special", label: "スペシャルケア" },
      { type: "uv", label: "UVカット" },
    ],
  },
];

interface CategoryItem {
  href: string;
  img: string;
  label: string;
}

interface CategoryPanel {
  sections: { heading?: string; items: CategoryItem[] }[];
  bottomLink: { href: string; label: string };
}

const categoryTabs = [
  { img: "/assets/img-icon-category-24.jpg", label: "スキンケア" },
  { img: "/assets/img-icon-category-25.jpg", label: "メイク" },
  { img: "/assets/img-icon-category-19.jpg", label: "ヘア＆ボディケア" },
  { img: "/assets/img-icon-category-14.jpg", label: "インナーケア・食品" },
  { img: "/assets/img-icon-category-27.jpg", label: "ボディウェア" },
];

const categoryPanels: CategoryPanel[] = [
  {
    sections: [
      {
        items: [
          { href: "/mid/120/", img: "/assets/img-icon-category-15.jpg", label: "クレンジング" },
          { href: "/mid/981/", img: "/assets/img-icon-category-16.jpg", label: "洗顔料" },
          { href: "/mid/982/", img: "/assets/img-icon-category-17.jpg", label: "化粧水" },
          { href: "/mid/983/", img: "/assets/img-icon-category-18.jpg", label: "保湿液・クリーム" },
          { href: "/mid/115/", img: "/assets/img-icon-category-28.jpg", label: "スペシャルケア・\n美容液" },
          { href: "/mid/112/", img: "/assets/img-icon-category-20.jpg", label: "オールインワン" },
          { href: "/mid/130/", img: "/assets/img-icon-category-21.jpg", label: "UVカット（日焼け止め）" },
          { href: "/mid/121/", img: "/assets/img-icon-category-43.jpg", label: "リップ" },
        ],
      },
    ],
    bottomLink: { href: "/skincare/", label: "スキンケアTOP" },
  },
  {
    sections: [
      {
        heading: "ベースメイク",
        items: [
          { href: "/mid/130/", img: "/assets/img-icon-category-21.jpg", label: "UVカット\n（日焼け止め）" },
          { href: "/mid/128/", img: "/assets/img-icon-category-22.jpg", label: "化粧下地・コンシーラー" },
          { href: "/mid/125/", img: "/assets/img-icon-category-23.jpg", label: "ファンデーション・\nBBクリーム" },
          { href: "/mid/129/", img: "/assets/img-skin-04.png", label: "仕上げ用アイテム・\nフェイスパウダー" },
        ],
      },
      {
        heading: "ポイントメイク",
        items: [
          { href: "/mid/131/", img: "/assets/img-icon-category-32.jpg", label: "アイブロー\n（眉メイク）" },
          { href: "/mid/122/", img: "/assets/img-make-04.png", label: "アイメイク" },
          { href: "/mid/121/", img: "/assets/img-make-02.png", label: "リップ" },
          { href: "/mid/123/", img: "/assets/img-make-05.png", label: "チーク・フェイスカラー" },
          { href: "/mid/124/", img: "/assets/img-make-03.png", label: "ネイル" },
          { href: "/mid/151/", img: "/assets/img-icon-category-33.jpg", label: "化粧小物・\nその他" },
        ],
      },
      {
        heading: "ブランド・シリーズ",
        items: [
          { href: "/mid/132/", img: "/assets/img-make-08.png", label: "オルビスユー\nベースメイク" },
          { href: "/mid/157/", img: "/assets/img-make-07.png", label: "オルビス\nミスター メイク" },
        ],
      },
    ],
    bottomLink: { href: "/makeup/", label: "メイクTOP" },
  },
  {
    sections: [
      {
        items: [
          { href: "/mid/130/", img: "/assets/img-icon-category-21.jpg", label: "UVカット（日焼け止め）" },
          { href: "/mid/145/", img: "/assets/img-icon-category-26.jpg", label: "シャンプー・ヘアケア" },
          { href: "/mid/155/", img: "/assets/img-icon-category-36.jpg", label: "ボディケア・ハンドケア" },
        ],
      },
    ],
    bottomLink: { href: "/bodycare/", label: "ヘア＆ボディケアTOP" },
  },
  {
    sections: [
      {
        items: [
          { href: "/mid/259/", img: "/assets/img-icon-category-14.jpg", label: "全ての商品" },
          { href: "/mid/264/", img: "/assets/img-icon-category-44.jpg", label: "ビューティー" },
          { href: "/mid/214/", img: "/assets/img-icon-category-34.jpg", label: "ダイエットサポート" },
          { href: "/mid/260/", img: "/assets/img-icon-category-45.jpg", label: "健康サポート" },
        ],
      },
    ],
    bottomLink: { href: "/innercare/", label: "インナーケア・食品TOP" },
  },
  {
    sections: [
      {
        items: [
          { href: "/mid/341/", img: "/assets/img-icon-category-35.jpg", label: "ブラジャー" },
          { href: "/mid/340/", img: "/assets/img-bodywear-02.png", label: "ショーツ" },
          { href: "/mid/330/", img: "/assets/img-bodywear-05.png", label: "インナー" },
          { href: "/mid/315/", img: "/assets/img-bodywear-03.png", label: "体型補整・ガードル" },
          { href: "/mid/370/", img: "/assets/img-bodywear-04.png", label: "ソックス・タイツ" },
        ],
      },
    ],
    bottomLink: { href: "/bodywear/", label: "ボディウェアTOP" },
  },
];

const purposes = [
  { label: "エイジングケア", href: "/mid/119/" },
  { label: "シミ・そばかす・美白", href: "/mid/163/" },
  { label: "毛穴", href: "/mid/116/" },
  { label: "ニキビ", href: "/mid/117/" },
  { label: "テカリ・べたつき", href: "/mid/164/" },
  { label: "シワ改善", href: "/mid/172/" },
  { label: "乾燥・ハリ低下", href: "/mid/160/" },
  { label: "くすみ・クマ", href: "/mid/162/" },
  { label: "敏感肌", href: "/mid/917/" },
];

function SeriesTag({ type, label }: { type: SeriesTagType; label: string }) {
  return (
    <li
      className={`inline-block text-[11px] font-medium leading-[1.8] px-[8px] py-[1px] rounded-[2px] text-[rgb(35,24,21)] ${seriesTagStyles[type]}`}
    >
      {label}
    </li>
  );
}

function BrandCardFeatured({ brand }: { brand: BrandItem }) {
  return (
    <div className="w-1/2 pt-[10px]">
      <a href={brand.href} className="flex items-center gap-[20px] no-underline text-[rgb(35,24,21)]">
        <img
          src={brand.img}
          alt=""
          className="w-[172px] h-[172px] object-cover flex-shrink-0"
        />
        <div className="flex flex-col gap-[4px]">
          <span className="text-[11px] font-medium leading-[1.8] text-[rgb(118,118,118)]">
            {brand.subTitle}
          </span>
          <span className="text-[14px] font-bold leading-[1.8]">
            {brand.title}
          </span>
          <ul className="flex flex-wrap gap-[4px] list-none p-0">
            {brand.tags.map((t, i) => (
              <SeriesTag key={i} type={t.type} label={t.label} />
            ))}
          </ul>
        </div>
      </a>
    </div>
  );
}

function BrandCardGrid({ brand }: { brand: BrandItem }) {
  return (
    <div className="w-1/4 pt-[30px]">
      <a href={brand.href} className="flex items-center gap-[10px] no-underline text-[rgb(35,24,21)]">
        <img
          src={brand.img}
          alt=""
          className="w-[80px] h-[80px] object-cover flex-shrink-0"
        />
        <div className="flex flex-col gap-[2px] flex-1 min-w-0">
          <span className="text-[11px] font-medium leading-[1.8] text-[rgb(118,118,118)]">
            {brand.subTitle}
          </span>
          <span className="text-[14px] font-bold leading-[1.8]">
            {brand.title}
          </span>
          <ul className="flex flex-wrap gap-[4px] list-none p-0">
            {brand.tags.map((t, i) => (
              <SeriesTag key={i} type={t.type} label={t.label} />
            ))}
          </ul>
        </div>
      </a>
    </div>
  );
}

function CategoryItemCard({ item }: { item: CategoryItem }) {
  return (
    <div className="flex flex-col items-center w-[110px] text-center">
      <a
        href={item.href}
        className="flex flex-col items-center gap-[6px] no-underline text-[rgb(35,24,21)] text-[12px] leading-[1.6]"
      >
        <img
          src={item.img}
          alt=""
          className="w-[80px] h-[80px] object-cover rounded-full"
        />
        <span className="whitespace-pre-line">{item.label}</span>
      </a>
    </div>
  );
}

export function SearchProducts() {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const handleCategoryClick = (index: number) => {
    setActiveCategory(activeCategory === index ? null : index);
  };

  return (
    <div
      className="is-hide--sp flex flex-col gap-[12px] w-[1050px] font-[500] text-[14px] leading-[1.8] text-[rgb(35,24,21)] font-[open_sans,游ゴシック体,YuGothic,游ゴシック_Medium,Yu_Gothic_Medium,YuGothic_Medium,游ゴシック,Yu_Gothic,ヒラギノ角ゴ_Pro_W3,Hiragino_Kaku_Gothic_Pro,メイリオ,Meiryo,sans-serif]"
    >
      <h2 className="text-[28px] font-bold leading-[1] text-center pb-[28px]">
        商品を探す
      </h2>

      {/* Search Form */}
      <div className="pb-[8px]">
        <form method="get" action="/search/">
          <div className="flex items-center border border-[rgb(205,205,205)] rounded-[4px] overflow-hidden max-w-[500px] self-center">
            <button
              type="submit"
              className="flex-shrink-0 w-[42px] h-[30px] bg-transparent border-none cursor-pointer flex items-center justify-center"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(35,24,21)" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            <input
              type="search"
              placeholder="キーワード・商品番号を入力"
              className="flex-1 h-[30px] border-none outline-none text-[13px] text-[rgb(35,24,21)] bg-transparent"
            />
          </div>
        </form>
      </div>

      {/* Tags */}
      <ul className="flex flex-wrap justify-center gap-[8px] list-none p-0 pb-[36px]">
        {tags.map((tag, i) => (
          <li key={i}>
            <a
              href={tag.href}
              className="inline-block px-[20px] py-[6px] border border-[rgb(205,205,205)] rounded-full bg-[rgb(255,247,237)] text-[14px] font-bold leading-[1.8] text-[rgb(35,24,21)] no-underline"
            >
              <span>{tag.label}</span>
            </a>
          </li>
        ))}
      </ul>

      <h3 className="text-[18px] font-bold leading-[1.8]">
        ブランド・シリーズから探す
      </h3>

      {/* Brand Featured (top 2) */}
      <div className="px-[30px] flex flex-col">
        <div className="flex">
          {brandsFeatured.map((brand, i) => (
            <BrandCardFeatured key={i} brand={brand} />
          ))}
        </div>
        <div className="flex flex-wrap">
          {brandsGrid.map((brand, i) => (
            <BrandCardGrid key={i} brand={brand} />
          ))}
        </div>
      </div>

      <div className="pt-[40px]">
        <h3 className="text-[18px] font-bold leading-[1.8] pb-[12px]">
          カテゴリから探す
        </h3>

        <div>
          <ul className="flex list-none p-0">
            {categoryTabs.map((tab, i) => (
              <li key={i} className="flex-1">
                <button
                  onClick={() => handleCategoryClick(i)}
                  className={`w-full flex items-center gap-[8px] py-[10px] px-[8px] border border-[rgb(205,205,205)] cursor-pointer text-[14px] font-medium leading-[1.8] text-[rgb(35,24,21)] transition-colors ${
                    activeCategory === i
                      ? "bg-[rgb(245,245,245)] border-b-transparent"
                      : "bg-white"
                  }`}
                >
                  <img
                    src={tab.img}
                    alt=""
                    className="w-[40px] h-[40px] object-cover rounded-full flex-shrink-0"
                  />
                  <span className="text-[12px]">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {activeCategory !== null && categoryPanels[activeCategory] && (
            <div className="flex flex-col gap-[24px] border border-t-0 border-[rgb(205,205,205)] p-[30px]">
              {categoryPanels[activeCategory].sections.map((section, si) => (
                <div key={si} className="flex flex-col gap-[12px]">
                  {section.heading && (
                    <p className="text-[14px] font-bold">
                      {section.heading}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-[16px]">
                    {section.items.map((item, ii) => (
                      <CategoryItemCard key={ii} item={item} />
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-center">
                <a
                  href={categoryPanels[activeCategory].bottomLink.href}
                  className="inline-block px-[40px] py-[10px] border border-[rgb(35,24,21)] text-[14px] font-medium text-[rgb(35,24,21)] no-underline"
                >
                  <span>{categoryPanels[activeCategory].bottomLink.label} &gt;</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-[40px]">
        <h3 className="text-[18px] font-bold leading-[1.8] pb-[12px]">
          お悩み・目的から探す
        </h3>

        <ul className="flex flex-wrap gap-[10px] list-none p-0">
          {purposes.map((p, i) => (
            <li key={i} className="w-[200px] h-[60px]">
              <a
                href={p.href}
                className="flex items-center justify-center w-full h-full border border-[rgb(205,205,205)] text-[14px] font-bold text-[rgb(35,24,21)] no-underline bg-white"
              >
                {p.label} &gt;
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
