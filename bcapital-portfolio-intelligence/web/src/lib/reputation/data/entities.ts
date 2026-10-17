/**
 * Reputation & Prestige — the four B Capital subjects and their sourced factors.
 * Every factor cites exactly one URL + date. Facts marked `verified: false` have no primary source and render as "not verified".
 * The engine (src/lib/reputation/engine, ported verbatim from the Rilian correlation engine) turns these factors into posts:
 * sharedObject → co-share, sourceUrl → co-link, tags → co-hashtag, relatedEntity → co-reply, title+detail → co-text.
 */
import type { EntityId, ReputationEntity, ReputationFactor, FactorCategory } from './types';

const BCAP = 'https://b.capital/';
const F = (
  n: number,
  category: FactorCategory,
  title: string,
  detail: string,
  sourceUrl: string,
  sourceName: string,
  sourceDate: string,
  tags: string[],
  extra: Partial<Pick<ReputationFactor, 'sharedObject' | 'relatedEntity' | 'riskFlag' | 'verified'>> = {},
): ReputationFactor => ({
  id: `F-${String(n).padStart(3, '0')}`,
  category,
  title,
  detail,
  sourceUrl,
  sourceName,
  sourceDate,
  verified: extra.verified ?? true,
  tags,
  ...(extra.sharedObject ? { sharedObject: extra.sharedObject } : {}),
  ...(extra.relatedEntity ? { relatedEntity: extra.relatedEntity } : {}),
  ...(extra.riskFlag ? { riskFlag: true } : {}),
});

const MIDAS = (n: number): ReputationFactor =>
  F(n, 'rankings', 'Forbes Midas List — not verified', 'No primary Forbes Midas List source was found for this entity; treated as not verified.', 'https://www.forbes.com/midas/', 'Forbes', '2026-10-17', ['midas', 'ranking'], { verified: false, sharedObject: 'Forbes Midas List' });

const bCapital: ReputationEntity = {
  id: 'b-capital',
  handle: '@bcapital',
  kind: 'firm',
  name: 'B Capital',
  role: 'Global multi-stage venture firm',
  location: 'Los Angeles · Singapore · 9 global locations',
  headline: '$12B+ AUM multi-stage platform, 200+ portfolio companies, BCG strategic partnership',
  narrative: [
    'B Capital was founded in 2015 by Eduardo Saverin, Raj Ganguly and Howard Morgan. By 2026 the firm reports more than $12 billion in assets under management, over 200 portfolio companies and nine global locations, with a strategic partnership with Boston Consulting Group and a sector focus on Technology, Healthcare, and Energy & Resilience.',
    'The fund series shows a steady scale-up: Fund I closed at $143.6 million in 2016, Fund II at $820 million in 2020 (taking AUM to $1.44 billion at the time), the early-stage Ascent Fund II at $250 million in 2022, Growth Fund III at $2.1 billion in January 2023, Opportunities Fund II at $750 million in March 2024, and Ascent Fund III oversubscribed at its $500 million hard cap in 2026 with 20+ investments including Apptronik, Havoc AI and Star Catcher.',
    'LPs disclosed for Opportunities Fund II include public and private pensions, family offices, high-net-worth individuals and sovereign wealth funds. The firm was ranked the largest venture capital investor in Los Angeles by capital under management (LA500, 2023) and added Jeff Johnson (ex-Temasek) as a General Partner and Rich Lesser (BCG Global Chair) as climate chair in 2024.',
    'Notable portfolio names include Byju\'s, Meesho, Ninja Van, PharmEasy, Icertis, Synack, Khatabook and Evidation Health. The one flagged risk is exposure to Byju\'s, the distressed edtech company.',
  ],
  photo: { src: '/assets/reputation/b-capital-logo.png', sourceUrl: 'https://b.capital/ (brand mark; local copy from web/public/brand)', alt: 'B Capital logo' },
  links: [
    { label: 'b.capital', url: BCAP },
    { label: 'About B Capital', url: 'https://b.capital/about/' },
  ],
  starterPrompts: [
    "How does B Capital's $12B AUM rank against multi-stage peers?",
    'Which B Capital funds drove the step-up from $1.44B to $12B AUM?',
    'How material is the Byju\'s exposure to B Capital\'s reputation?',
    'What does the BCG partnership add to B Capital\'s platform story?',
  ],
  factors: [
    F(1, 'track-record', 'Founded 2015 by Saverin, Ganguly and Howard Morgan', 'B Capital was founded in 2015 by Eduardo Saverin, Raj Ganguly and Howard Morgan.', BCAP, 'B Capital', '2026-01-01', ['founding', 'firm'], { sharedObject: 'B Capital' }),
    F(2, 'aum-fund-size', '$12+ billion AUM, 200+ portfolio companies, 9 global locations', 'The firm reports more than $12 billion in assets under management, over 200 portfolio companies and nine global locations.', BCAP, 'B Capital', '2026-01-01', ['aum', 'portfolio', 'global'], { sharedObject: 'B Capital' }),
    F(3, 'network', 'Strategic partnership with Boston Consulting Group', 'B Capital maintains a strategic partnership with BCG; sector focus Technology, Healthcare, Energy & Resilience.', 'https://b.capital/about/', 'B Capital', '2026-01-01', ['bcg', 'partnership', 'sectors'], { sharedObject: 'Boston Consulting Group' }),
    F(4, 'aum-fund-size', 'Fund I closed at $143.6M (2016)', 'First fund of US$143.6 million with a stated focus on Asian growth.', 'https://theedgemalaysia.com/article/facebook-co-founder-saverin%E2%80%99s-b-capital-raises-us1436-mil-eyes-asian-growth', 'The Edge Malaysia', '2016-05-01', ['fund', 'asia'], { sharedObject: 'Fund I', relatedEntity: 'eduardo-saverin' }),
    F(5, 'aum-fund-size', 'Fund II closed at $820M; AUM $1.44B at the time (2020)', 'B Capital Group closed its $820 million second fund to support global innovation, bringing total AUM to $1.44 billion.', 'https://b.capital/insights/b-capital-group-closes-820mm-second-fund-to-support-global-innovation/', 'B Capital', '2020-06-30', ['fund', 'aum'], { sharedObject: 'Fund II' }),
    F(6, 'aum-fund-size', 'Ascent Fund II: $250M early-stage fund (2022)', 'B Capital closed a $250 million early-stage fund dedicated to building the economy of the future.', 'https://b.capital/news-article/b-capital-closes-250m-early-stage-fund-dedicated-to-building-the-economy-of-the-future/', 'B Capital', '2022-07-19', ['fund', 'early-stage', 'ascent'], { sharedObject: 'Ascent Fund II', relatedEntity: 'karan-mohla' }),
    F(7, 'media-sentiment', 'Forbes: Saverin\'s B Capital raises $250M early-stage fund', 'Forbes coverage of the Ascent Fund II close, framed around Facebook co-founder Eduardo Saverin.', 'https://www.forbes.com/sites/jonathanburgos/2022/07/20/facebook-billionaire-eduardo-saverins-b-capital-raises-250-million-for-its-early-stage-vc-fund/', 'Forbes', '2022-07-20', ['media', 'ascent', 'fund'], { sharedObject: 'Ascent Fund II', relatedEntity: 'eduardo-saverin' }),
    F(8, 'aum-fund-size', 'Growth Fund III: $2.1B (2023)', 'Bloomberg reported Eduardo Saverin\'s B Capital raised $2.1 billion for its third growth fund.', 'https://www.bloomberg.com/news/articles/2023-01-19/eduardo-saverin-s-b-capital-raises-2-1-billion', 'Bloomberg', '2023-01-19', ['fund', 'growth', 'media'], { sharedObject: 'Growth Fund III', relatedEntity: 'eduardo-saverin' }),
    F(9, 'aum-fund-size', 'Opportunities Fund II: $750M (2024)', 'B Capital closed Opportunities Fund II at $750 million.', 'https://b.capital/news-article/b-capital-closes-opportunities-fund-ii-at-750-million/', 'B Capital', '2024-03-19', ['fund', 'opportunities'], { sharedObject: 'Opportunities Fund II', relatedEntity: 'raj-ganguly' }),
    F(10, 'co-investor-lp-quality', 'LPs: pensions, family offices, HNWIs, sovereign wealth funds', 'Reuters: LPs in the $750 million Opportunities Fund II include public and private pensions, family offices, high-net-worth individuals and sovereign wealth funds.', 'https://www.reuters.com/business/finance/facebook-co-founder-saverins-b-capital-raises-750-mln-new-opportunities-fund-2024-03-19/', 'Reuters', '2024-03-19', ['lp', 'sovereign', 'pension', 'fund'], { sharedObject: 'Opportunities Fund II' }),
    F(11, 'aum-fund-size', 'Ascent Fund III oversubscribed at $500M hard cap (2026)', 'Ascent Fund III closed oversubscribed at its $500 million hard cap with 20+ investments including Apptronik, Havoc AI and Star Catcher.', 'https://peforum.org/b-capital-closes-oversubscribed-ascent-fund-iii-at-500-million-hard-cap/', 'PE Forum', '2026-01-01', ['fund', 'ascent', 'early-stage', 'ai'], { sharedObject: 'Ascent Fund III' }),
    F(12, 'media-sentiment', 'WSJ: $500M early-stage fund as startup valuations soar', 'Wall Street Journal Pro coverage of the Ascent Fund III launch.', 'https://www.wsj.com/pro/venture-capital/b-capital-unveils-500-million-early-stage-fund-as-startup-valuations-soar-cd73bc9e', 'The Wall Street Journal', '2026-01-01', ['media', 'ascent', 'fund'], { sharedObject: 'Ascent Fund III' }),
    F(13, 'thought-leadership', '2025 AGM "Venture at AI Velocity" — $9B venture growth platform', 'The 2025 Annual General Meeting and CEO Summit highlighted AI-driven investment momentum, a $9 billion venture growth platform and 200+ CEOs.', 'https://b.capital/news-article/b-capital-highlights-ai-driven-investment-momentum-and-global-thought-leadership-at-2025-annual-general-meeting-and-ceo-summit/', 'B Capital', '2025-10-23', ['ai', 'agm', 'thought-leadership', 'ceo'], { sharedObject: '2025 AGM' }),
    F(14, 'network', '200+ portfolio CEOs convened at the 2025 CEO Summit', 'The AGM and CEO Summit convened more than 200 CEOs across the portfolio.', 'https://b.capital/news-article/b-capital-highlights-ai-driven-investment-momentum-and-global-thought-leadership-at-2025-annual-general-meeting-and-ceo-summit/', 'B Capital', '2025-10-23', ['network', 'ceo', 'ai'], { sharedObject: '2025 AGM' }),
    F(15, 'unicorns', 'Notable portfolio: Byju\'s, Meesho, Ninja Van, PharmEasy, Icertis, Synack, Khatabook, Evidation Health', 'Portfolio names listed across the firm\'s site and coverage.', BCAP, 'B Capital', '2026-01-01', ['portfolio', 'asia', 'unicorn'], { sharedObject: 'Icertis' }),
    F(16, 'track-record', 'Meesho, Ninja Van and PharmEasy among the Asia growth bets', 'Asia-focused growth positions cited in the firm\'s portfolio.', BCAP, 'B Capital', '2026-01-01', ['asia', 'portfolio', 'growth'], { sharedObject: 'Meesho' }),
    F(17, 'rankings', 'Largest VC in Los Angeles by capital under management (LA500 2023)', 'Los Angeles Business Journal\'s LA500 ranked B Capital the largest venture capital firm in Los Angeles by capital under management.', 'https://labusinessjournal.com/special-editions/la500/2023-la500/finance-2023/la500-2023-raj-ganguly/', 'Los Angeles Business Journal', '2023-01-01', ['ranking', 'los-angeles', 'aum'], { sharedObject: 'LA500', relatedEntity: 'raj-ganguly' }),
    F(18, 'network', '2024 hires: Jeff Johnson (ex-Temasek) GP, Rich Lesser (BCG Global Chair) climate chair', 'Caproasia reports the 2024 additions of Jeff Johnson as General Partner and Rich Lesser as climate chair.', 'https://www.caproasia.com/2025/11/11/facebook-co-founder-eduardo-saverin-9-billion-b-capital-raised-307-million-for-early-stage-fund-b-capital-ascent-fund-iii/', 'Caproasia', '2025-11-11', ['bcg', 'temasek', 'hires', 'network'], { sharedObject: 'Boston Consulting Group' }),
    F(19, 'risk-controversy', 'Risk flag: exposure to Byju\'s (distressed edtech)', 'Byju\'s, a B Capital portfolio company, is a distressed edtech position; coverage of the firm (Forbes 2022) lists it among the headline bets.', 'https://www.forbes.com/sites/jonathanburgos/2022/07/20/facebook-billionaire-eduardo-saverins-b-capital-raises-250-million-for-its-early-stage-vc-fund/', 'Forbes', '2022-07-20', ['risk', 'edtech', 'byjus'], { sharedObject: "Byju's", riskFlag: true }),
    F(20, 'risk-controversy', 'Risk flag: Byju\'s exposure noted in Reuters fund coverage', 'Reuters\' 2024 Opportunities Fund II report is the later reference point for the Byju\'s exposure.', 'https://www.reuters.com/business/finance/facebook-co-founder-saverins-b-capital-raises-750-mln-new-opportunities-fund-2024-03-19/', 'Reuters', '2024-03-19', ['risk', 'edtech', 'byjus'], { sharedObject: "Byju's", riskFlag: true }),
    F(21, 'founder-references', 'Founders Circle roundtables hosted with Eduardo Saverin', 'Founder-facing roundtables in Singapore run by the firm\'s co-founder.', 'https://b.capital/founders-circle-with-eduardo/', 'B Capital', '2026-01-01', ['founders', 'singapore', 'network'], { sharedObject: 'Founders Circle', relatedEntity: 'eduardo-saverin' }),
  ],
};

const saverin: ReputationEntity = {
  id: 'eduardo-saverin',
  handle: '@eduardosaverin',
  kind: 'person',
  name: 'Eduardo Saverin',
  role: 'Co-Founder & Co-CEO',
  location: 'Singapore',
  headline: 'Facebook co-founder and first investor; Bloomberg Billionaires #56; anchors B Capital\'s Asia network',
  narrative: [
    'Eduardo Saverin is Co-Founder and Co-CEO of B Capital, based in Singapore. He was the first investor and a co-founder of Facebook and holds a Harvard BA.',
    'Bloomberg Billionaires ranks him #56 globally with a stake of about 2% in Meta; Forbes placed him #1 on Singapore\'s Richest 2023 with a net worth of US$16 billion. His LinkedIn audience is around 2 million followers.',
    'His thought leadership and founder engagement run through B Capital\'s channels — the 2021 "Why we invested: Meesho" piece and the Founders Circle roundtables in Singapore — which map directly onto the firm\'s Asia deal flow.',
    'Two risk flags are on record: he renounced US citizenship in 2011, and the 2009 Facebook ownership lawsuit was settled.',
  ],
  photo: { src: '/assets/reputation/eduardo-saverin.jpg', sourceUrl: 'https://b.capital/wp-content/uploads/team_member/eduardo_saverin.jpg', alt: 'Eduardo Saverin, Co-Founder & Co-CEO, B Capital', fallbackSourceUrl: 'https://media.licdn.com/dms/image/v2/C4D03AQE79Q_bdXyY4Q/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1516249607360?e=2147483647&v=beta&t=4T_s6HSoMrNKLEWrTs5OgYH_TzQQyMesuf5xP7t4HMY' },
  links: [
    { label: 'B Capital team page', url: 'https://b.capital/team/eduardo-saverin/' },
    { label: 'Bloomberg Billionaires profile', url: 'https://www.bloomberg.com/billionaires/profiles/eduardo-l-saverin/' },
    { label: 'Forbes profile', url: 'https://www.forbes.com/profile/eduardo-saverin/' },
    { label: 'LinkedIn', url: 'https://sg.linkedin.com/in/saverin' },
  ],
  starterPrompts: [
    "What does Eduardo Saverin's network mean for B Capital's Asia deal flow?",
    'How do the 2011 citizenship and 2009 lawsuit flags weigh against Saverin\'s standing with LPs?',
    'Which sourced facts connect Saverin most strongly to the B Capital fund series?',
    'How does Saverin\'s thought leadership compare with Raj Ganguly\'s media footprint?',
  ],
  factors: [
    F(1, 'track-record', 'Co-Founder & Co-CEO of B Capital; co-founder and first investor of Facebook', 'Harvard BA; based in Singapore.', 'https://b.capital/team/eduardo-saverin/', 'B Capital', '2026-01-01', ['founding', 'facebook', 'singapore'], { sharedObject: 'B Capital', relatedEntity: 'b-capital' }),
    F(2, 'track-record', 'Co-founded B Capital in 2015 with Raj Ganguly and Howard Morgan', 'B Capital was founded in 2015 by Saverin, Ganguly and Morgan.', BCAP, 'B Capital', '2026-01-01', ['founding', 'firm'], { sharedObject: 'B Capital', relatedEntity: 'raj-ganguly' }),
    F(3, 'rankings', 'Bloomberg Billionaires global rank #56; ~2% Meta stake', 'Bloomberg Billionaires Index profile.', 'https://www.bloomberg.com/billionaires/profiles/eduardo-l-saverin/', 'Bloomberg', '2026-01-01', ['ranking', 'meta', 'billionaire'], { sharedObject: 'Bloomberg Billionaires Index' }),
    F(4, 'rankings', '#1 Forbes Singapore\'s Richest 2023 — net worth US$16B', 'Vulcan Post on the 2023 Forbes Singapore rich list.', 'https://vulcanpost.com/839362/eduardo-saverin-top-spot-singapore-rich-list-2023/', 'Vulcan Post', '2023-09-01', ['ranking', 'singapore', 'forbes'], { sharedObject: 'Forbes Singapore\'s Richest' }),
    MIDAS(5),
    F(6, 'media-sentiment', 'Forbes profile', 'Standing Forbes billionaire profile.', 'https://www.forbes.com/profile/eduardo-saverin/', 'Forbes', '2026-01-01', ['media', 'forbes'], { sharedObject: 'Forbes' }),
    F(7, 'media-sentiment', 'Forbes Asia: "From Silicon Valley to Singapore" interview', 'Forbes Asia interview with Saverin and his VC partners on accelerating innovation.', 'https://www.forbes.com/sites/pamelaambler/2019/10/13/from-silicon-valley-to-singapore-eduardo-saverin-and-vc-partners-approach-to-accelerate-innovation/', 'Forbes', '2019-10-13', ['media', 'forbes', 'asia'], { sharedObject: 'Forbes', relatedEntity: 'raj-ganguly' }),
    F(8, 'network', 'LinkedIn audience ~2M followers', 'Public LinkedIn profile.', 'https://sg.linkedin.com/in/saverin', 'LinkedIn', '2026-01-01', ['network', 'linkedin'], { sharedObject: 'LinkedIn' }),
    F(9, 'thought-leadership', '"Why we invested: Meesho" (2021-09-29)', 'Investment thesis piece on Meesho published through B Capital.', BCAP, 'B Capital', '2021-09-29', ['thought-leadership', 'asia', 'meesho'], { sharedObject: 'Meesho' }),
    F(10, 'founder-references', 'Founders Circle roundtables in Singapore', 'Founder roundtables hosted with Eduardo in Singapore.', 'https://b.capital/founders-circle-with-eduardo/', 'B Capital', '2026-01-01', ['founders', 'singapore', 'network'], { sharedObject: 'Founders Circle', relatedEntity: 'b-capital' }),
    F(11, 'aum-fund-size', 'Fund I ($143.6M, 2016) raised with an Asian-growth mandate', 'The Edge Malaysia on Saverin\'s B Capital first close.', 'https://theedgemalaysia.com/article/facebook-co-founder-saverin%E2%80%99s-b-capital-raises-us1436-mil-eyes-asian-growth', 'The Edge Malaysia', '2016-05-01', ['fund', 'asia'], { sharedObject: 'Fund I', relatedEntity: 'b-capital' }),
    F(12, 'aum-fund-size', 'Growth Fund III ($2.1B, 2023) reported under Saverin\'s name', 'Bloomberg: Eduardo Saverin\'s B Capital raises $2.1 billion.', 'https://www.bloomberg.com/news/articles/2023-01-19/eduardo-saverin-s-b-capital-raises-2-1-billion', 'Bloomberg', '2023-01-19', ['fund', 'growth', 'media'], { sharedObject: 'Growth Fund III', relatedEntity: 'b-capital' }),
    F(13, 'risk-controversy', 'Risk flag: renounced US citizenship (2011)', 'Recorded in the Bloomberg Billionaires profile.', 'https://www.bloomberg.com/billionaires/profiles/eduardo-l-saverin/', 'Bloomberg', '2026-01-01', ['risk', 'citizenship'], { sharedObject: 'Bloomberg Billionaires Index', riskFlag: true }),
    F(14, 'risk-controversy', 'Risk flag: 2009 Facebook ownership lawsuit settlement', 'Recorded in the Bloomberg Billionaires profile.', 'https://www.bloomberg.com/billionaires/profiles/eduardo-l-saverin/', 'Bloomberg', '2026-01-01', ['risk', 'lawsuit', 'facebook'], { sharedObject: 'Bloomberg Billionaires Index', riskFlag: true }),
  ],
};

const ganguly: ReputationEntity = {
  id: 'raj-ganguly',
  handle: '@rajganguly',
  kind: 'person',
  name: 'Raj Ganguly',
  role: 'Co-Founder & Co-CEO',
  location: 'Los Angeles',
  headline: 'Ex-Bain Capital technology lead; Icertis board; LA500 2023; CNBC and Davos voice on AI',
  narrative: [
    'Raj Ganguly is Co-Founder and Co-CEO of B Capital, based in Los Angeles. Before B Capital he was at Bain Capital, where he co-led the global technology initiative, and earlier at McKinsey, Diageo and Miradiant (acquired by J.P. Morgan). He holds an HBS MBA and Wharton/Penn Engineering degrees.',
    'He sits on the board of Icertis, is a senior advisor to BCG, and was profiled in the Los Angeles Business Journal\'s LA500 2023 — the same listing that ranked B Capital the largest VC in Los Angeles by capital under management.',
    'His public footprint runs through CNBC (Squawk Box Asia on the $750 million Opportunities Fund II in March 2024; Davos 2026 on AI in pharma and biotech), the 10/10 and Fintech Leaders podcasts, a 2019 Forbes Asia interview alongside Eduardo Saverin, and a LinkedIn audience of about 30,000.',
  ],
  photo: { src: '/assets/reputation/raj-ganguly.jpg', sourceUrl: 'https://b.capital/wp-content/uploads/team_member/raj_ganguly.jpg', alt: 'Raj Ganguly, Co-Founder & Co-CEO, B Capital', fallbackSourceUrl: 'https://media.licdn.com/dms/image/v2/D5603AQFubE1eOOqV2g/profile-displayphoto-scale_200_200/B56Z4W1n5dIkAc-/0/1778499617137?e=2147483647&v=beta&t=-7F9snms0WfQR9WGv2IivkQqlqrP7raCy0OWmrtXwBI' },
  links: [
    { label: 'B Capital team page', url: 'https://b.capital/team/raj-ganguly/' },
    { label: 'Icertis board', url: 'https://www.icertis.com/company/leadership/board/raj-ganguly/' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/rajganguly' },
  ],
  starterPrompts: [
    "How does Raj Ganguly's track record compare to peer growth investors?",
    'What does the Icertis board seat signal about Ganguly\'s enterprise software network?',
    'How does Ganguly\'s CNBC and Davos presence shape B Capital\'s AI narrative?',
    'Which of Ganguly\'s sourced facts overlap with the B Capital fund series?',
  ],
  factors: [
    F(1, 'track-record', 'Co-Founder & Co-CEO; ex-Bain Capital (co-led global technology initiative)', 'Earlier roles at McKinsey, Diageo and Miradiant; HBS MBA, Wharton/Penn Engineering.', 'https://b.capital/team/raj-ganguly/', 'B Capital', '2026-01-01', ['bain', 'mckinsey', 'founding'], { sharedObject: 'B Capital', relatedEntity: 'b-capital' }),
    F(2, 'track-record', 'Co-founded B Capital in 2015 with Eduardo Saverin and Howard Morgan', 'B Capital was founded in 2015 by Saverin, Ganguly and Morgan.', BCAP, 'B Capital', '2026-01-01', ['founding', 'firm'], { sharedObject: 'B Capital', relatedEntity: 'eduardo-saverin' }),
    F(3, 'exits', 'Miradiant — acquired by J.P. Morgan', 'Operating exit prior to B Capital.', 'https://b.capital/team/raj-ganguly/', 'B Capital', '2026-01-01', ['exit', 'acquisition'], { sharedObject: 'Miradiant' }),
    F(4, 'board-seats', 'Board member, Icertis', 'Listed on the Icertis board of directors page.', 'https://www.icertis.com/company/leadership/board/raj-ganguly/', 'Icertis', '2026-01-01', ['board', 'enterprise', 'saas'], { sharedObject: 'Icertis', relatedEntity: 'b-capital' }),
    F(5, 'network', 'BCG senior advisor', 'Noted in the LA500 2023 profile.', 'https://labusinessjournal.com/special-editions/la500/2023-la500/finance-2023/la500-2023-raj-ganguly/', 'Los Angeles Business Journal', '2023-01-01', ['bcg', 'advisor', 'network'], { sharedObject: 'Boston Consulting Group' }),
    F(6, 'rankings', 'LA500 2023 (Los Angeles Business Journal)', 'Profiled in the LA500 2023; B Capital ranked largest VC in Los Angeles by capital under management.', 'https://labusinessjournal.com/special-editions/la500/2023-la500/finance-2023/la500-2023-raj-ganguly/', 'Los Angeles Business Journal', '2023-01-01', ['ranking', 'los-angeles'], { sharedObject: 'LA500', relatedEntity: 'b-capital' }),
    MIDAS(7),
    F(8, 'media-sentiment', 'CNBC Squawk Box Asia on the $750M Opportunities Fund II', 'Co-CEO discusses the new $750 million opportunities fund.', 'https://www.cnbc.com/video/2024/03/26/investment-firm-b-capital-announces-its-new-750-million-opportunities-fund-co-ceo-discusses.html', 'CNBC', '2024-03-25', ['media', 'cnbc', 'fund', 'opportunities'], { sharedObject: 'Opportunities Fund II', relatedEntity: 'b-capital' }),
    F(9, 'thought-leadership', 'Davos 2026 on CNBC: pharma/biotech transformation through AI', 'CNBC Davos 2026 segment.', 'https://www.cnbc.com/video/2026/01/23/b-capital-pharma-biotech-undergoing-transformation-thanks-to-ai.html', 'CNBC', '2026-01-23', ['ai', 'healthcare', 'davos', 'media'], { sharedObject: 'CNBC' }),
    F(10, 'thought-leadership', '10/10 podcast: Raj Ganguly, B Capital', 'Long-form podcast interview.', 'https://www.tenoneten.com/podcast/raj-ganguly-b-capital', 'Ten One Ten', '2026-01-01', ['podcast', 'thought-leadership'], { sharedObject: 'Podcast' }),
    F(11, 'thought-leadership', 'Fintech Leaders: investing in transformational technologies', 'Podcast / newsletter interview.', 'https://fintechleaders.substack.com/p/investing-in-transformational-technologies', 'Fintech Leaders', '2026-01-01', ['podcast', 'fintech', 'thought-leadership'], { sharedObject: 'Podcast' }),
    F(12, 'media-sentiment', 'Forbes Asia: "From Silicon Valley to Singapore" (with Saverin)', 'Forbes Asia interview with Saverin and his VC partners.', 'https://www.forbes.com/sites/pamelaambler/2019/10/13/from-silicon-valley-to-singapore-eduardo-saverin-and-vc-partners-approach-to-accelerate-innovation/', 'Forbes', '2019-10-13', ['media', 'forbes', 'asia'], { sharedObject: 'Forbes', relatedEntity: 'eduardo-saverin' }),
    F(13, 'network', 'LinkedIn audience ~30K followers', 'Public LinkedIn profile.', 'https://www.linkedin.com/in/rajganguly', 'LinkedIn', '2026-01-01', ['network', 'linkedin'], { sharedObject: 'LinkedIn' }),
  ],
};

const mohla: ReputationEntity = {
  id: 'karan-mohla',
  handle: '@karanmohla',
  kind: 'person',
  name: 'Karan Mohla',
  role: 'General Partner, leads South & Southeast Asia',
  location: 'Singapore / India',
  headline: 'Founding Ascent team member; ex-Chiratae partner (FirstCry, Xpressbees, HealthifyMe); 40-under-40 lists',
  narrative: [
    'Karan Mohla is a General Partner at B Capital leading South & Southeast Asia. His current investments include Bhanzu, Sugar.fit, MoEngage, Turno, Nektar, Carro, Eureka Robotics and SolarSquare.',
    'Before B Capital he was a Partner at Chiratae Ventures (FirstCry, Xpressbees, HealthifyMe — 20+ companies) and earlier at QVT Finance and Jefferies. He holds a Michigan Ross BBA and an INSEAD MBA, and has been named to the Business World 40 under 40 and IAAIF 40 under 40 lists.',
    'He is a founding member of the Ascent early-stage team, has published "Why We Invested" pieces on SolarSquare (2026) and Eureka Robotics (2025), spoke at IGF UK-India Week 2023 and on Money20/20 Middle East panels in Riyadh (2026), and carries a LinkedIn audience of about 17,000.',
  ],
  photo: { src: '/assets/reputation/karan-mohla.jpg', sourceUrl: 'https://b.capital/wp-content/uploads/team_member/karan_mohla.jpg', alt: 'Karan Mohla, General Partner, B Capital' },
  links: [
    { label: 'B Capital team page', url: 'https://b.capital/team/karan-mohla/' },
    { label: 'LinkedIn', url: 'https://sg.linkedin.com/in/karan-mohla-153998' },
    { label: 'KrASIA interview', url: 'https://kr-asia.com/what-it-takes-for-indian-startups-to-go-global-qa-with-karan-mohla-of-chiratae-ventures' },
  ],
  starterPrompts: [
    "How concentrated is Karan Mohla's South & Southeast Asia portfolio?",
    'How does Mohla\'s Chiratae record (FirstCry, Xpressbees, HealthifyMe) inform his B Capital early-stage bets?',
    'Which sourced facts link Mohla to the Ascent fund series?',
    'What do the Eureka Robotics and SolarSquare theses say about Mohla\'s sector focus?',
  ],
  factors: [
    F(1, 'track-record', 'General Partner leading South & Southeast Asia', 'Michigan Ross BBA, INSEAD MBA; earlier QVT Finance and Jefferies.', 'https://b.capital/team/karan-mohla/', 'B Capital', '2026-01-01', ['asia', 'india', 'southeast-asia'], { sharedObject: 'B Capital', relatedEntity: 'b-capital' }),
    F(2, 'track-record', 'Investments: Bhanzu, Sugar.fit, MoEngage, Turno, Nektar, Carro, Eureka Robotics, SolarSquare', 'Current B Capital investments led from South & Southeast Asia.', 'https://b.capital/team/karan-mohla/', 'B Capital', '2026-01-01', ['asia', 'portfolio', 'early-stage'], { sharedObject: 'Eureka Robotics' }),
    F(3, 'exits', 'Ex-Partner, Chiratae Ventures — FirstCry, Xpressbees, HealthifyMe (20+ companies)', 'Prior venture record at Chiratae Ventures.', 'https://b.capital/team/karan-mohla/', 'B Capital', '2026-01-01', ['india', 'exit', 'chiratae'], { sharedObject: 'Chiratae Ventures' }),
    F(4, 'rankings', 'Business World 40 under 40; IAAIF 40 under 40', 'Listed on the B Capital team page.', 'https://b.capital/team/karan-mohla/', 'B Capital', '2026-01-01', ['ranking', '40under40', 'india'], { sharedObject: '40 under 40' }),
    MIDAS(5),
    F(6, 'thought-leadership', '"Why We Invested in SolarSquare" (2026-07-06)', 'Investment thesis published through B Capital.', 'https://b.capital/team/karan-mohla/', 'B Capital', '2026-07-06', ['thought-leadership', 'energy', 'india'], { sharedObject: 'SolarSquare' }),
    F(7, 'thought-leadership', '"Why We Invested: Eureka Robotics" (2025-01-09)', 'Investment thesis published through B Capital.', 'https://b.capital/team/karan-mohla/', 'B Capital', '2025-01-09', ['thought-leadership', 'ai', 'robotics'], { sharedObject: 'Eureka Robotics' }),
    F(8, 'aum-fund-size', 'Founding member of the Ascent early-stage team (Ascent Fund II, $250M)', 'Named in the Ascent Fund II close announcement.', 'https://b.capital/news-article/b-capital-closes-250m-early-stage-fund-dedicated-to-building-the-economy-of-the-future/', 'B Capital', '2022-07-19', ['fund', 'ascent', 'early-stage'], { sharedObject: 'Ascent Fund II', relatedEntity: 'b-capital' }),
    F(9, 'thought-leadership', 'Speaker, IGF UK-India Week 2023', 'India Global Forum session recording.', 'https://www.youtube.com/watch?v=Ear_HgkuCPQ', 'India Global Forum (YouTube)', '2023-06-01', ['india', 'speaker', 'thought-leadership'], { sharedObject: 'IGF UK-India Week' }),
    F(10, 'network', 'Money20/20 Middle East Riyadh panels (2026); LinkedIn ~17K followers', 'Public LinkedIn profile and activity.', 'https://sg.linkedin.com/in/karan-mohla-153998', 'LinkedIn', '2026-01-01', ['network', 'linkedin', 'fintech'], { sharedObject: 'LinkedIn' }),
    F(11, 'media-sentiment', 'KrASIA: what it takes for Indian startups to go global (Chiratae era)', 'Q&A interview with Karan Mohla of Chiratae Ventures.', 'https://kr-asia.com/what-it-takes-for-indian-startups-to-go-global-qa-with-karan-mohla-of-chiratae-ventures', 'KrASIA', '2019-01-01', ['media', 'india', 'chiratae'], { sharedObject: 'Chiratae Ventures' }),
  ],
};

export const ENTITIES: ReputationEntity[] = [bCapital, saverin, ganguly, mohla];
export const ENTITY_BY_ID: Record<EntityId, ReputationEntity> = { 'b-capital': bCapital, 'eduardo-saverin': saverin, 'raj-ganguly': ganguly, 'karan-mohla': mohla };
export function getEntity(id: string): ReputationEntity | undefined {
  return (ENTITY_BY_ID as Record<string, ReputationEntity | undefined>)[id];
}
