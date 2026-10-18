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
  headline: '$12B+ AUM; Ascent Fund III closed oversubscribed at its $500M hard cap; BCG partnership; led by Saverin, Ganguly and Morgan',
  narrative: [
    'B Capital is the firm behind every other card on this page, and its reputation rests on scale that has compounded fund by fund: a $360 million first fund (Bloomberg, 2018), an $820 million second fund that took AUM to $1.44 billion (2020), $2.1 billion for Growth Fund III (Bloomberg, January 2023) and $750 million for Opportunities Fund II (Forbes, March 2024, up from $415 million in 2020).',
    'The early-stage line tells the 2026 story. Bloomberg reported talks for a $500 million fund in June 2023; Caproasia counted $307 million raised by November 2025 when AUM stood at $9 billion; and Ascent Fund III then closed oversubscribed at its $500 million hard cap — nearly double Ascent II\'s $254 million — taking the platform past $12 billion. It writes Seed to Series B cheques in healthcare, enterprise, energy and frontier tech across North America and Asia, with Apptronik, Havoc AI and Star Catcher among 20+ investments.',
    'The platform pairs that capital with a strategic partnership with Boston Consulting Group and a leadership bench of Eduardo Saverin, Raj Ganguly and Howard Morgan. The one reputational drag on record, the Byju\'s position, stays flagged on the card.',
  ],
  photo: { src: '/brand/b-capital-logo.svg', sourceUrl: 'https://b.capital/ (official B Capital logo; web/public/brand/b-capital-logo.svg)', alt: 'B Capital logo' },
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
    F(2, 'aum-fund-size', 'More than $12B AUM across the platform (2026)', 'PE Forum (2026): with Ascent Fund III closed, B Capital manages more than $12 billion across its growth, early-stage (Ascent) and opportunities funds.', 'https://peforum.org/b-capital-closes-oversubscribed-ascent-fund-iii-at-500-million-hard-cap/', 'PE Forum', '2026-07-22', ['aum', 'portfolio', 'global'], { sharedObject: 'B Capital' }),
    F(3, 'network', 'BCG strategic partnership; led by Saverin, Ganguly and Howard Morgan', 'B Capital pairs its investment team with a strategic partnership with Boston Consulting Group; the firm is led by Eduardo Saverin, Raj Ganguly and Howard Morgan, with offices across the US and Asia.', 'https://b.capital/about/', 'B Capital', '2026-10-18', ['bcg', 'partnership', 'leadership', 'geography'], { sharedObject: 'Boston Consulting Group' }),
    F(4, 'aum-fund-size', 'Fund I closed at $143.6M (2016)', 'First fund of US$143.6 million with a stated focus on Asian growth.', 'https://theedgemalaysia.com/article/facebook-co-founder-saverin%E2%80%99s-b-capital-raises-us1436-mil-eyes-asian-growth', 'The Edge Malaysia', '2016-05-01', ['fund', 'asia'], { sharedObject: 'Fund I', relatedEntity: 'eduardo-saverin' }),
    F(5, 'aum-fund-size', 'Fund II closed at $820M; AUM $1.44B at the time (2020)', 'B Capital Group closed its $820 million second fund to support global innovation, bringing total AUM to $1.44 billion.', 'https://b.capital/insights/b-capital-group-closes-820mm-second-fund-to-support-global-innovation/', 'B Capital', '2020-06-30', ['fund', 'aum'], { sharedObject: 'Fund II' }),
    F(6, 'aum-fund-size', 'Ascent Fund II: $254M early-stage fund (July 2022)', 'The predecessor early-stage vehicle, Ascent Fund II, closed at $254 million in July 2022; Ascent Fund III nearly doubles it.', 'https://peforum.org/b-capital-closes-oversubscribed-ascent-fund-iii-at-500-million-hard-cap/', 'PE Forum', '2022-07-19', ['fund', 'early-stage', 'ascent'], { sharedObject: 'Ascent Fund II', relatedEntity: 'karan-mohla' }),
    F(7, 'media-sentiment', 'Forbes: Saverin\'s B Capital raises $250M early-stage fund', 'Forbes coverage of the Ascent Fund II close, framed around Facebook co-founder Eduardo Saverin.', 'https://www.forbes.com/sites/jonathanburgos/2022/07/20/facebook-billionaire-eduardo-saverins-b-capital-raises-250-million-for-its-early-stage-vc-fund/', 'Forbes', '2022-07-20', ['media', 'ascent', 'fund'], { sharedObject: 'Ascent Fund II', relatedEntity: 'eduardo-saverin' }),
    F(8, 'aum-fund-size', 'Growth Fund III: $2.1B (Bloomberg, 2023-01-19)', 'Bloomberg reported Eduardo Saverin\'s B Capital raised $2.1 billion for its third growth fund.', 'https://www.bloomberg.com/news/articles/2023-01-19/eduardo-saverin-s-b-capital-raises-2-1-billion', 'Bloomberg', '2023-01-19', ['fund', 'growth', 'media'], { sharedObject: 'Growth Fund III', relatedEntity: 'eduardo-saverin' }),
    F(9, 'aum-fund-size', 'Opportunities Fund II: $750M, up from $415M in 2020 (Forbes, 2024-03-20)', 'Forbes: billionaire Eduardo Saverin\'s B Capital raised $750 million to fund late-stage startups — Opportunities Fund II, versus $415 million for the 2020 predecessor.', 'https://www.forbes.com/sites/yessarrosendar/2024/03/20/billionaire-eduardo-saverins-b-capital-raises-750-million-to-fund-late-stage-startups/', 'Forbes', '2024-03-20', ['fund', 'opportunities', 'media', 'forbes'], { sharedObject: 'Opportunities Fund II', relatedEntity: 'raj-ganguly' }),
    F(10, 'co-investor-lp-quality', 'LPs: pensions, family offices, HNWIs, sovereign wealth funds', 'Reuters: LPs in the $750 million Opportunities Fund II include public and private pensions, family offices, high-net-worth individuals and sovereign wealth funds.', 'https://www.reuters.com/business/finance/facebook-co-founder-saverins-b-capital-raises-750-mln-new-opportunities-fund-2024-03-19/', 'Reuters', '2024-03-19', ['lp', 'sovereign', 'pension', 'fund'], { sharedObject: 'Opportunities Fund II' }),
    F(11, 'aum-fund-size', 'Ascent Fund III: final close at $500M hard cap, oversubscribed (2026)', 'Ascent Fund III closed oversubscribed at its $500 million hard cap — nearly double Ascent II — investing Seed to Series B in healthcare, enterprise, energy and frontier tech across North America and Asia; 20+ investments including Apptronik, Havoc AI and Star Catcher.', 'https://peforum.org/b-capital-closes-oversubscribed-ascent-fund-iii-at-500-million-hard-cap/', 'PE Forum', '2026-07-22', ['fund', 'ascent', 'early-stage', 'sector', 'geography'], { sharedObject: 'Ascent Fund III' }),
    F(12, 'media-sentiment', 'WSJ: B Capital unveils $500M early-stage fund as startup valuations soar', 'Wall Street Journal Pro coverage of the Ascent Fund III close (press tier: WSJ).', 'https://www.wsj.com/pro/venture-capital/b-capital-unveils-500-million-early-stage-fund-as-startup-valuations-soar-cd73bc9e', 'The Wall Street Journal', '2026-07-22', ['media', 'ascent', 'fund', 'press-tier'], { sharedObject: 'Ascent Fund III' }),
    F(13, 'thought-leadership', '2025 AGM "Venture at AI Velocity" — $9B venture growth platform', 'The 2025 Annual General Meeting and CEO Summit highlighted AI-driven investment momentum, a $9 billion venture growth platform and 200+ CEOs.', 'https://b.capital/news-article/b-capital-highlights-ai-driven-investment-momentum-and-global-thought-leadership-at-2025-annual-general-meeting-and-ceo-summit/', 'B Capital', '2025-10-23', ['ai', 'agm', 'thought-leadership', 'ceo'], { sharedObject: '2025 AGM' }),
    F(14, 'aum-fund-size', 'Ascent Fund III at $307M interim; AUM $9B (Caproasia, 2025-11-11)', 'Caproasia: Eduardo Saverin\'s $9 billion B Capital had raised $307 million for early-stage Ascent Fund III by November 2025.', 'https://www.caproasia.com/2025/11/11/facebook-co-founder-eduardo-saverin-9-billion-b-capital-raised-307-million-for-early-stage-fund-b-capital-ascent-fund-iii/', 'Caproasia', '2025-11-11', ['fund', 'ascent', 'aum'], { sharedObject: 'Ascent Fund III', relatedEntity: 'eduardo-saverin' }),
    F(15, 'unicorns', 'Notable portfolio: Byju\'s, Meesho, Ninja Van, PharmEasy, Icertis, Synack, Khatabook, Evidation Health', 'Portfolio names listed across the firm\'s site and coverage.', BCAP, 'B Capital', '2026-01-01', ['portfolio', 'asia', 'unicorn'], { sharedObject: 'Icertis' }),
    F(16, 'aum-fund-size', 'In talks to raise $500M for the next early-stage fund (Bloomberg, 2023-06-05)', 'Bloomberg: Facebook co-founder Eduardo Saverin\'s B Capital was in talks to raise $500 million for a VC fund — the target Ascent Fund III later hit.', 'https://www.bloomberg.com/news/articles/2023-06-05/facebook-co-founder-eduardo-saverin-in-talks-to-raise-500-million-for-vc-fund', 'Bloomberg', '2023-06-05', ['fund', 'ascent', 'media'], { sharedObject: 'Ascent Fund III', relatedEntity: 'eduardo-saverin' }),
    F(17, 'rankings', 'Largest VC in Los Angeles by capital under management (LA500 2023)', 'Los Angeles Business Journal\'s LA500 ranked B Capital the largest venture capital firm in Los Angeles by capital under management.', 'https://labusinessjournal.com/special-editions/la500/2023-la500/finance-2023/la500-2023-raj-ganguly/', 'Los Angeles Business Journal', '2023-01-01', ['ranking', 'los-angeles', 'aum'], { sharedObject: 'LA500', relatedEntity: 'raj-ganguly' }),
    F(18, 'network', '2024 hires: Jeff Johnson (ex-Temasek) GP, Rich Lesser (BCG Global Chair) climate chair', 'Caproasia reports the 2024 additions of Jeff Johnson as General Partner and Rich Lesser as climate chair.', 'https://www.caproasia.com/2025/11/11/facebook-co-founder-eduardo-saverin-9-billion-b-capital-raised-307-million-for-early-stage-fund-b-capital-ascent-fund-iii/', 'Caproasia', '2025-11-11', ['bcg', 'temasek', 'hires', 'network'], { sharedObject: 'Boston Consulting Group' }),
    F(19, 'risk-controversy', 'Risk flag: exposure to Byju\'s (distressed edtech)', 'Byju\'s, a B Capital portfolio company, is a distressed edtech position; coverage of the firm (Forbes 2022) lists it among the headline bets.', 'https://www.forbes.com/sites/jonathanburgos/2022/07/20/facebook-billionaire-eduardo-saverins-b-capital-raises-250-million-for-its-early-stage-vc-fund/', 'Forbes', '2022-07-20', ['risk', 'edtech', 'byjus'], { sharedObject: "Byju's", riskFlag: true }),
    F(20, 'aum-fund-size', 'First fund closed at $360M (Bloomberg, 2018-02-09)', 'Bloomberg: Facebook co-founder Saverin\'s B Capital closed a $360 million fund.', 'https://www.bloomberg.com/news/articles/2018-02-09/facebook-co-founder-saverin-s-b-capital-closes-360-million-fund', 'Bloomberg', '2018-02-09', ['fund', 'media', 'press-tier'], { sharedObject: 'Fund I', relatedEntity: 'eduardo-saverin' }),
    F(21, 'media-sentiment', 'Business Standard: $750M Opportunities Fund II for late-stage startups (2024-03-19)', 'Indian business press coverage of the Opportunities Fund II close.', 'https://www.business-standard.com/companies/start-ups/b-capital-closes-750-mn-opportunities-fund-ii-for-late-stage-startups-124031900739_1.html', 'Business Standard', '2024-03-19', ['media', 'opportunities', 'india', 'geography'], { sharedObject: 'Opportunities Fund II' }),
  ],
};

const saverin: ReputationEntity = {
  id: 'eduardo-saverin',
  handle: '@eduardosaverin',
  kind: 'person',
  name: 'Eduardo Saverin',
  role: 'Co-Founder & Co-CEO',
  location: 'Singapore',
  headline: 'Facebook\'s first investor and co-founder; Bloomberg Billionaires #56; Co-CEO of B Capital from Singapore',
  narrative: [
    'Eduardo Saverin brings B Capital the rarest kind of signalling power: he was Facebook\'s first investor and a co-founder, still holds a stake of about 2% in Meta, and ranks #56 on the Bloomberg Billionaires Index.',
    'He runs B Capital as Co-Founder and Co-CEO from Singapore (Harvard BA), and his name leads the headline of nearly every fund announcement — Bloomberg\'s 2018 first close, the $2.1 billion Growth Fund III in 2023, Forbes\' 2024 Opportunities Fund II story and Caproasia\'s 2025 Ascent Fund III update.',
    'For founders in Asia that address and that name are the draw; the Founders Circle roundtables turn it into deal flow. The record also carries two older flags — the 2011 renunciation of US citizenship and the settled 2009 Facebook ownership suit — which are kept visible.',
  ],
  photo: { src: '/reputation/people/eduardo-saverin.jpg', sourceUrl: 'https://b.capital/wp-content/uploads/team_member/eduardo_saverin.jpg', alt: 'Eduardo Saverin, Co-Founder & Co-CEO, B Capital', fallbackSourceUrl: 'https://media.licdn.com/dms/image/v2/C4D03AQE79Q_bdXyY4Q/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1516249607360?e=2147483647&v=beta&t=4T_s6HSoMrNKLEWrTs5OgYH_TzQQyMesuf5xP7t4HMY' },
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
    F(1, 'track-record', 'Co-Founder & Co-CEO of B Capital; Facebook\'s first investor and co-founder', 'B Capital team page: Co-Founder and Co-CEO, based in Singapore; Harvard BA.', 'https://b.capital/team/eduardo-saverin/', 'B Capital', '2026-10-18', ['founding', 'facebook', 'singapore', 'geography'], { sharedObject: 'B Capital', relatedEntity: 'b-capital' }),
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
  headline: 'Co-CEO in Los Angeles; ex-Bain Capital technology co-lead; ~130 founders backed; Icertis board',
  narrative: [
    'Raj Ganguly is the operator-investor of the founding pair. Before co-founding B Capital he co-led Bain Capital\'s global technology initiative, after McKinsey, Diageo and Miradiant (acquired by J.P. Morgan); he holds an HBS MBA and Wharton / Penn Engineering degrees.',
    'From Los Angeles he has backed roughly 130 founders (10/10 podcast), sits on the Icertis board, advises BCG and was profiled in the LA500 2023 — the listing that ranked B Capital the largest VC in Los Angeles by capital under management.',
    'He is also the firm\'s most visible broadcast voice: on CNBC when the $750 million Opportunities Fund II was announced in 2024, and at Davos 2026 on how AI is reshaping pharma and biotech.',
  ],
  photo: { src: '/reputation/people/raj-ganguly.jpg', sourceUrl: 'https://b.capital/wp-content/uploads/team_member/raj_ganguly.jpg', alt: 'Raj Ganguly, Co-Founder & Co-CEO, B Capital', fallbackSourceUrl: 'https://media.licdn.com/dms/image/v2/D5603AQFubE1eOOqV2g/profile-displayphoto-scale_200_200/B56Z4W1n5dIkAc-/0/1778499617137?e=2147483647&v=beta&t=-7F9snms0WfQR9WGv2IivkQqlqrP7raCy0OWmrtXwBI' },
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
    F(1, 'track-record', 'Co-Founder & Co-CEO; ex-Bain Capital technology co-lead', 'B Capital team page: Co-Founder and Co-CEO, based in Los Angeles; previously Bain Capital, McKinsey, Diageo and Miradiant; HBS MBA, Wharton / Penn Engineering.', 'https://b.capital/team/raj-ganguly/', 'B Capital', '2026-10-18', ['bain', 'mckinsey', 'founding', 'geography'], { sharedObject: 'B Capital', relatedEntity: 'b-capital' }),
    F(2, 'track-record', 'Co-founded B Capital in 2015 with Eduardo Saverin and Howard Morgan', 'B Capital was founded in 2015 by Saverin, Ganguly and Morgan.', BCAP, 'B Capital', '2026-01-01', ['founding', 'firm'], { sharedObject: 'B Capital', relatedEntity: 'eduardo-saverin' }),
    F(3, 'exits', 'Miradiant — acquired by J.P. Morgan', 'Operating exit prior to B Capital.', 'https://b.capital/team/raj-ganguly/', 'B Capital', '2026-01-01', ['exit', 'acquisition'], { sharedObject: 'Miradiant' }),
    F(4, 'board-seats', 'Board member, Icertis', 'Listed on the Icertis board of directors page.', 'https://www.icertis.com/company/leadership/board/raj-ganguly/', 'Icertis', '2026-01-01', ['board', 'enterprise', 'saas'], { sharedObject: 'Icertis', relatedEntity: 'b-capital' }),
    F(5, 'network', 'BCG senior advisor', 'Noted in the LA500 2023 profile.', 'https://labusinessjournal.com/special-editions/la500/2023-la500/finance-2023/la500-2023-raj-ganguly/', 'Los Angeles Business Journal', '2023-01-01', ['bcg', 'advisor', 'network'], { sharedObject: 'Boston Consulting Group' }),
    F(6, 'rankings', 'LA500 2023 (Los Angeles Business Journal)', 'Profiled in the LA500 2023; B Capital ranked largest VC in Los Angeles by capital under management.', 'https://labusinessjournal.com/special-editions/la500/2023-la500/finance-2023/la500-2023-raj-ganguly/', 'Los Angeles Business Journal', '2023-01-01', ['ranking', 'los-angeles'], { sharedObject: 'LA500', relatedEntity: 'b-capital' }),
    MIDAS(7),
    F(8, 'media-sentiment', 'CNBC Squawk Box Asia on the $750M Opportunities Fund II', 'Co-CEO discusses the new $750 million opportunities fund.', 'https://www.cnbc.com/video/2024/03/26/investment-firm-b-capital-announces-its-new-750-million-opportunities-fund-co-ceo-discusses.html', 'CNBC', '2024-03-25', ['media', 'cnbc', 'fund', 'opportunities'], { sharedObject: 'Opportunities Fund II', relatedEntity: 'b-capital' }),
    F(9, 'thought-leadership', 'Davos 2026 on CNBC: pharma/biotech transformation through AI', 'CNBC Davos 2026 segment.', 'https://www.cnbc.com/video/2026/01/23/b-capital-pharma-biotech-undergoing-transformation-thanks-to-ai.html', 'CNBC', '2026-01-23', ['ai', 'healthcare', 'davos', 'media'], { sharedObject: 'CNBC' }),
    F(10, 'network', 'Has backed about 130 founders', '10/10 podcast profile: Raj Ganguly and B Capital have backed roughly 130 founders.', 'https://www.tenoneten.com/podcast/raj-ganguly-b-capital', 'Ten One Ten', '2026-10-18', ['founders', 'network', 'podcast'], { sharedObject: 'Podcast' }),
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
  headline: 'GP leading South & Southeast Asia from Singapore / India; 20+ years; ex-Chiratae partner; BW 40 under 40',
  narrative: [
    'Karan Mohla is B Capital\'s on-the-ground reputation in South and Southeast Asia. A General Partner with 20+ years in finance and technology investing, splitting his time between Singapore and India, he backs Bhanzu, Sugar.fit, MoEngage, Turno, Nektar, Carro, Eureka Robotics (2025) and SolarSquare (2026).',
    'His record predates the firm: a Partner at Chiratae Ventures working on FirstCry, Xpressbees and HealthifyMe, and before that QVT and Jefferies. He holds a Michigan Ross BBA and an INSEAD MBA and is a BW 40 under 40 honouree.',
    'As a founding member of the Ascent early-stage team he authors the firm\'s "Why We Invested" theses on SolarSquare and Eureka Robotics, so his card connects most strongly to the Ascent fund series and to energy and robotics bets in India.',
  ],
  photo: { src: '/reputation/people/karan-mohla.jpg', sourceUrl: 'https://b.capital/wp-content/uploads/team_member/karan_mohla.jpg', alt: 'Karan Mohla, General Partner, B Capital' },
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
    F(1, 'track-record', 'General Partner leading South & Southeast Asia; 20+ years in finance and technology', 'B Capital team page: GP leading South and Southeast Asia, based between Singapore and India; 20+ years; Michigan Ross BBA, INSEAD MBA.', 'https://b.capital/team/karan-mohla/', 'B Capital', '2026-07-06', ['asia', 'india', 'southeast-asia', 'geography'], { sharedObject: 'B Capital', relatedEntity: 'b-capital' }),
    F(2, 'track-record', 'Portfolio: Bhanzu, Sugar.fit, MoEngage, Turno, Nektar, Carro, Eureka Robotics, SolarSquare', 'Current B Capital investments led from South & Southeast Asia.', 'https://b.capital/team/karan-mohla/', 'B Capital', '2026-07-06', ['asia', 'portfolio', 'early-stage', 'sector'], { sharedObject: 'Eureka Robotics' }),
    F(3, 'exits', 'Ex-Partner, Chiratae Ventures; earlier QVT and Jefferies', 'Prior venture record at Chiratae (FirstCry, Xpressbees, HealthifyMe), after QVT and Jefferies.', 'https://b.capital/team/karan-mohla/', 'B Capital', '2026-07-06', ['india', 'exit', 'chiratae'], { sharedObject: 'Chiratae Ventures' }),
    F(4, 'rankings', 'BW 40 under 40', 'Listed on the B Capital team page (also IAAIF 40 under 40).', 'https://b.capital/team/karan-mohla/', 'B Capital', '2026-07-06', ['ranking', '40under40', 'india'], { sharedObject: '40 under 40' }),
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
