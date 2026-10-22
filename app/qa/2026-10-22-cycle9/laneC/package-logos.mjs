import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import sharp from 'sharp';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36';

const RESOLVED_ORGS = [
  {
    id: 'airev',
    name: 'AIREV',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://www.airev.ae/assets/AIREV-logo-ca9cd9ef.svg',
    format: 'svg',
    license_note: 'trademark of AIREV; used for identification only',
    entity_check: 'Retrieved from official domain www.airev.ae Vite bundle, matched AIREV wordmark'
  },
  {
    id: 'g42',
    name: 'G42',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://www.g42.ai/application/themes/G42/dist/images/logo.png',
    format: 'png',
    license_note: 'trademark of G42; used for identification only',
    entity_check: 'Retrieved from official domain g42.ai navigation bar, matched G42 logo'
  },
  {
    id: 'core42',
    name: 'Core42',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://www.core42.ai/hubfs/Core42_2026_Theme/Images/Logo-1.svg',
    format: 'svg',
    license_note: 'trademark of Core42; used for identification only',
    entity_check: 'Retrieved from official domain core42.ai header navigation, matched Core42 brandmark'
  },
  {
    id: 'presight',
    name: 'Presight AI Holding PLC',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://www.presight.ai/hubfs/Presight_2026/Logo.svg',
    format: 'svg',
    license_note: 'trademark of Presight AI; used for identification only',
    entity_check: 'Retrieved from official domain presight.ai header, matched Presight logo'
  },
  {
    id: 'aiq',
    name: 'AIQ',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://aiq.ae/application/themes/aiqtheme/assets/images/logo.svg',
    format: 'svg',
    license_note: 'trademark of AIQ; used for identification only',
    entity_check: 'Retrieved from official domain aiq.ae header, matched AIQ brandmark'
  },
  {
    id: 'tii',
    name: 'Technology Innovation Institute',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://webfiles.tii.ae/static/tii-logo-dark.svg',
    format: 'svg',
    license_note: 'trademark of Technology Innovation Institute; used for identification only',
    entity_check: 'Retrieved from official domain tii.ae header navigation, matched TII logo'
  },
  {
    id: 'atrc',
    name: 'Advanced Technology Research Council',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://atrc.gov.ae/themes/custom/atrc_ae/logo.svg',
    format: 'svg',
    license_note: 'trademark of ATRC Abu Dhabi; used for identification only',
    entity_check: 'Retrieved from official domain atrc.gov.ae header, matched ATRC logo'
  },
  {
    id: 'ai71',
    name: 'AI71',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://ai71.ai/wf/cdn/68d4dfb8b73b6229785de619/68d4dfb8b73b6229785de644_ai71-logo.svg',
    format: 'svg',
    license_note: 'trademark of AI71; used for identification only',
    entity_check: 'Retrieved from official domain ai71.ai header, matched AI71 brandmark'
  },
  {
    id: 'edge',
    name: 'EDGE Group',
    status: 'wikimedia',
    source_tier: 'wikimedia',
    source_url: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Edge_Group_Logo.svg',
    format: 'svg',
    license_note: 'Wikimedia Commons, CC BY-SA 4.0 / trademark of EDGE Group',
    entity_check: 'Verified on Wikimedia Commons File:Edge Group Logo.svg, matches EDGE Group corporate identity'
  },
  {
    id: 'mbzuai',
    name: 'Mohamed bin Zayed University of Artificial Intelligence',
    status: 'wikimedia',
    source_tier: 'wikimedia',
    source_url: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Mbzuai_logo.png',
    format: 'png',
    license_note: 'Wikimedia Commons, Fair use / trademark of MBZUAI',
    entity_check: 'Verified on Wikimedia Commons File:Mbzuai logo.png, matches MBZUAI brand'
  },
  {
    id: 'khalifa-university',
    name: 'Khalifa University of Science and Technology',
    status: 'wikimedia',
    source_tier: 'wikimedia',
    source_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Khalifa_University_New_Logo.png',
    format: 'png',
    license_note: 'Wikimedia Commons, Fair use / trademark of Khalifa University',
    entity_check: 'Verified on Wikimedia Commons File:Khalifa University New Logo.png, matches Khalifa University wordmark'
  },
  {
    id: 'eand-enterprise',
    name: 'e& enterprise',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://www.eandenterprise.com/content/dam/eandenterprise/en/system/assets/images/demo/eand-enterpriese-logo.svg',
    format: 'svg',
    license_note: 'trademark of e& enterprise / e& group; used for identification only',
    entity_check: 'Retrieved from official domain www.eandenterprise.com header, matched e& enterprise logo'
  },
  {
    id: 'hub71',
    name: 'Hub71',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://www.hub71.com/svgs/logo2.svg',
    format: 'svg',
    license_note: 'trademark of Hub71; used for identification only',
    entity_check: 'Retrieved from official domain hub71.com header, matched Hub71 brandmark'
  },
  {
    id: 'm42',
    name: 'M42',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://m42.ae/media/acdbeduz/header-logo.svg',
    format: 'svg',
    license_note: 'trademark of M42 Health; used for identification only',
    entity_check: 'Retrieved from official domain m42.ae header, matched M42 logo'
  },
  {
    id: 'khazna',
    name: 'Khazna Data Centers',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://khaznadatacenters.com/wp-content/uploads/2025/04/logo-1.svg',
    format: 'svg',
    license_note: 'trademark of Khazna Data Centers; used for identification only',
    entity_check: 'Retrieved from official domain khaznadatacenters.com header, matched Khazna logo'
  },
  {
    id: 'mgx',
    name: 'MGX',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://www.mgx.ae/sites/mgx-corp-v2/files/mgx/mgx-logo.svg',
    format: 'svg',
    license_note: 'trademark of MGX; used for identification only',
    entity_check: 'Retrieved from official domain mgx.ae header, matched MGX logo'
  },
  {
    id: 'mubadala',
    name: 'Mubadala Investment Company',
    status: 'wikimedia',
    source_tier: 'wikimedia',
    source_url: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Mubadala_Investment_logo.svg',
    format: 'svg',
    license_note: 'Wikimedia Commons, Fair use / trademark of Mubadala Investment Company',
    entity_check: 'Verified on Wikimedia Commons File:Mubadala Investment logo.svg, matches Mubadala corporate identity'
  },
  {
    id: 'adnoc',
    name: 'Abu Dhabi National Oil Company (ADNOC)',
    status: 'wikimedia',
    source_tier: 'wikimedia',
    source_url: 'https://upload.wikimedia.org/wikipedia/en/1/1c/Abu_Dhabi_National_Oil_Company_logo.svg',
    format: 'svg',
    license_note: 'Wikipedia, Fair use / trademark of ADNOC',
    entity_check: 'Verified on en.wikipedia File:Abu Dhabi National Oil Company logo.svg, matches ADNOC logo'
  },
  {
    id: 'purehealth',
    name: 'PureHealth',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://purehealth.ae/wp-content/uploads/2024/12/image-130.png',
    format: 'png',
    license_note: 'trademark of PureHealth; used for identification only',
    entity_check: 'Retrieved from official domain purehealth.ae, matched PureHealth logo'
  },
  {
    id: 'daman',
    name: 'Daman (The National Insurance Company)',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://www.damaninsurance.ae/wp-content/uploads/2023/09/daman-logo.svg',
    format: 'svg',
    license_note: 'trademark of National Health Insurance Company Daman; used for identification only',
    entity_check: 'Retrieved from official domain damaninsurance.ae header, matched Daman logo'
  },
  {
    id: 'digital-dubai',
    name: 'Digital Dubai',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://digitaldubai.ae/ResourcePackages/Theme/assets/dist/images/logo.png',
    format: 'png',
    license_note: 'trademark of Digital Dubai Authority; used for identification only',
    entity_check: 'Retrieved from official domain digitaldubai.ae header, matched Digital Dubai logo'
  },
  {
    id: 'dubai-police',
    name: 'Dubai Police',
    status: 'wikimedia',
    source_tier: 'wikimedia',
    source_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Dubai-police-logo-vector.png',
    format: 'png',
    license_note: 'Wikimedia Commons, Fair use / trademark of Dubai Police',
    entity_check: 'Verified on Wikimedia Commons File:Dubai-police-logo-vector.png, matches Dubai Police emblem'
  },
  {
    id: 'dff',
    name: 'Dubai Future Foundation',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://www.dubaifuture.ae/wp-content/uploads/2023/02/dff-05.svg',
    format: 'svg',
    license_note: 'trademark of Dubai Future Foundation; used for identification only',
    entity_check: 'Retrieved from official domain dubaifuture.ae, matched Dubai Future Foundation logo'
  },
  {
    id: 'dcai',
    name: 'Dubai Centre for Artificial Intelligence',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://www.dubaifuture.ae/wp-content/uploads/2025/08/DCAI-logo-new.svg',
    format: 'svg',
    license_note: 'trademark of Dubai Centre for Artificial Intelligence; used for identification only',
    entity_check: 'Retrieved from official Dubai Future Foundation initiative page at dubaifuture.ae, matched DCAI logo'
  },
  {
    id: 'saal-ai',
    name: 'Saal.ai',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://saal.ai/wp-content/themes/saal/assets/images/Logo-Saal2.svg',
    format: 'svg',
    license_note: 'trademark of Saal.ai; used for identification only',
    entity_check: 'Retrieved from official domain saal.ai header, matched Saal.ai brandmark'
  },
  {
    id: 'astra-tech',
    name: 'Astra Tech',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://astratech.ae/images/favicon.svg',
    format: 'svg',
    license_note: 'trademark of Astra Tech; used for identification only',
    entity_check: 'Retrieved from official domain astratech.ae, matched Astra Tech brandmark'
  },
  {
    id: 'micropolis',
    name: 'Micropolis Robotics',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://micropolis.ai/favicon.svg',
    format: 'svg',
    license_note: 'trademark of Micropolis Robotics; used for identification only',
    entity_check: 'Retrieved from official domain micropolis.ai, matched Micropolis icon'
  },
  {
    id: 'xpanceo',
    name: 'XPANCEO',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://assets.xpanceo.com/logo-white.svg',
    format: 'svg',
    license_note: 'trademark of XPANCEO; used for identification only',
    entity_check: 'Retrieved from official assets host assets.xpanceo.com, matched XPANCEO wordmark'
  },
  {
    id: 'positron',
    name: 'Positron AI Ltd',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://positron.ai/_next/static/media/logo.8bdc4e11.svg',
    format: 'svg',
    license_note: 'trademark of Positron AI; used for identification only',
    entity_check: 'Retrieved from official domain positron.ai header navigation, matched Positron AI logo'
  },
  {
    id: 'derq',
    name: 'Derq',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://images.squarespace-cdn.com/content/v1/587b7fc9a5790ab82b96b1eb/80411c2a-cad0-4665-9542-ff0c96fe5cc9/Derq-Inc.-primary-logo.png?format=1500w',
    format: 'png',
    license_note: 'trademark of Derq; used for identification only',
    entity_check: 'Retrieved from official domain derq.com header logo, matched Derq primary logo'
  },
  {
    id: 'cntxt',
    name: 'CNTXT AI',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://cntxt.com/wp-content/uploads/2025/05/180973_CNTXT_CI_Brandmark_FA_LB_20230115-04-Colour.webp',
    format: 'webp',
    license_note: 'trademark of CNTXT; used for identification only',
    entity_check: 'Retrieved from official domain cntxt.com brandmark assets, matched CNTXT corporate brandmark'
  },
  {
    id: 'whiteshield',
    name: 'Whiteshield',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://www.whiteshield.ai/assets/img/d4d1250f8d1733e4.png',
    format: 'png',
    license_note: 'trademark of Whiteshield; used for identification only',
    entity_check: 'Retrieved from official domain whiteshield.ai navigation logo, matched Whiteshield logo'
  },
  {
    id: 'dge',
    name: 'Department of Government Enablement (DGE), Abu Dhabi',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://dge.gov.ae/resources/DGE/dist/img/logo.png',
    format: 'png',
    license_note: 'trademark of Abu Dhabi Department of Government Enablement; used for identification only',
    entity_check: 'Retrieved from official domain dge.gov.ae brand assets, matched DGE Abu Dhabi logo'
  },
  {
    id: 'echotwin',
    name: 'EchoTwin AI',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://images.squarespace-cdn.com/content/v1/66e061edcdefd643f95869a7/9fe960ca-c384-4e81-8e30-1d1323cdaf32/ET.Logo.Black+%288%29.png',
    format: 'png',
    license_note: 'trademark of EchoTwin AI; used for identification only',
    entity_check: 'Retrieved from official domain echotwin.ai header, matched EchoTwin AI logo'
  },
  {
    id: 'endimension',
    name: 'Endimension Technology',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://endimension.com/wp-content/uploads/2021/07/Untitled__1_-removebg-preview.png',
    format: 'png',
    license_note: 'trademark of Endimension Technology; used for identification only',
    entity_check: 'Retrieved from official domain endimension.com header, matched Endimension logo'
  },
  {
    id: 'aspire',
    name: 'ASPIRE',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://aspireuae.ae/themes/custom/aspire/images/logo.svg',
    format: 'svg',
    license_note: 'trademark of ASPIRE UAE; used for identification only',
    entity_check: 'Retrieved from official domain aspireuae.ae header, matched ASPIRE logo'
  },
  {
    id: 'on-demand',
    name: 'OnDemand',
    status: 'official',
    source_tier: 'official',
    source_url: 'https://on-demand.io/logo-light.ico',
    format: 'ico',
    license_note: 'trademark of OnDemand (on-demand.io); used for engine credit identification',
    entity_check: 'Retrieved from official domain on-demand.io logo-light.ico, extracted 256x256 high-resolution entry via PIL'
  }
];

const UNRESOLVED_REASONS = {
  'ai-data-authority': 'New federal authority established June 2026 by UAE Cabinet; no official brand identity or vector logo published',
  'inception': 'Integrated G42 applied AI unit; no standalone >=256px vector or raster logo published',
  'space42': 'Official domain space42.ai blocked by Cloudflare anti-bot interstitial; no standalone >=256px asset retrievable',
  'analog': 'Official standalone domain unavailable (analog.ai domain-for-sale parking page); no verified official logo',
  'katim': 'EDGE Group subsidiary with no independent domain; katim.com returns HTTP 403',
  'adasi': 'EDGE Group subsidiary with no standalone website; no independent official logo asset retrievable',
  'ifm': 'Institute of Foundation Models is an academic department within MBZUAI without separate corporate mark',
  'dubai-ai-campus': 'Domain difc.com/ai-campus blocked behind Vercel security checkpoint; no standalone >=256px asset retrievable',
  'doh-abu-dhabi': 'Official portal doh.gov.ae SSL handshake timed out; no verified public vector logo on Commons',
  'camb-ai': 'Only low-resolution 48px icon available on homepage; fails >=256px raster threshold',
  'neuphonic': 'Only 64px and 180px favicon images available on site; fails >=256px raster threshold',
  'steerai': 'Official domain steerai.com failed with SSL EOF protocol error; no verified public logo asset',
  'aiatc': 'Federal council (Artificial Intelligence and Advanced Technology Council); no official domain or logo published',
  'injazat': 'Website injazat.com redirects to core42.ai following brand absorption into Core42; no standalone active identity'
};

async function fetchBuffer(url) {
  const tmp = `/tmp/logo_download_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  execSync(`curl -sL --max-time 15 -A '${UA}' '${url}' -o '${tmp}'`, { stdio: ['pipe', 'pipe', 'ignore'] });
  const buf = fs.readFileSync(tmp);
  fs.unlinkSync(tmp);
  return buf;
}

function computeSha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function getInitials(name) {
  return name.replace(/\(.*?\)/g, '')
    .split(/[\s&–-]+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';
}

function makeMonogramSvg(initials) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect x="0.5" y="0.5" width="511" height="511" rx="64" fill="#F9F9F9" stroke="#E5E5E5" stroke-width="1"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#0D0D0D" font-family="Inter, system-ui, -apple-system, sans-serif" font-weight="600" font-size="180">${initials}</text>
</svg>`;
}

async function processImageVariants(inputBuffer, isSvg) {
  const sharpOpts = isSvg ? { density: 300 } : {};

  // card-512: fit inside 400x400 then pad to 512x512
  const card512 = await sharp(inputBuffer, sharpOpts)
    .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 56, bottom: 56, left: 56, right: 56, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // list-128: fit inside 100x100 then pad to 128x128
  const list128 = await sharp(inputBuffer, sharpOpts)
    .resize(100, 100, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 14, bottom: 14, left: 14, right: 14, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  // list-64: fit inside 50x50 then pad to 64x64
  const list64 = await sharp(inputBuffer, sharpOpts)
    .resize(50, 50, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 7, bottom: 7, left: 7, right: 7, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return { card512, list128, list64 };
}

async function main() {
  const orgsData = JSON.parse(fs.readFileSync('src/data/uae_cc_v1/orgs.json', 'utf8'));
  const orgs = orgsData.organizations;

  const manifest = {
    generated_at: new Date().toISOString(),
    policy: 'grayscale-by-default-colour-on-hover',
    items: {},
    unresolved: []
  };

  const logosJson = {};

  fs.mkdirSync('public/logos', { recursive: true });
  fs.mkdirSync('public/logos/uae', { recursive: true });

  console.log(`Processing ${RESOLVED_ORGS.length} resolved organisations...`);

  for (const item of RESOLVED_ORGS) {
    const slug = item.id;
    console.log(`\n--> [${slug}] Fetching ${item.source_url}`);
    const outDir = path.join('public/logos', slug);
    fs.mkdirSync(outDir, { recursive: true });

    let origBuffer = await fetchBuffer(item.source_url);
    const origExt = item.format === 'svg' ? 'svg' : item.format === 'ico' ? 'ico' : item.format === 'webp' ? 'webp' : 'png';
    const origPath = path.join(outDir, `original.${origExt}`);
    fs.writeFileSync(origPath, origBuffer);

    let rasterBuffer = origBuffer;
    let width = 0;
    let height = 0;

    if (item.format === 'ico') {
      // Extract 256x256 PNG via Python PIL
      const tmpIco = `/tmp/temp_${slug}.ico`;
      const tmpPng = `/tmp/temp_${slug}_256.png`;
      fs.writeFileSync(tmpIco, origBuffer);
      execSync(`python3 -c "
from PIL import Image
im = Image.open('${tmpIco}')
img256 = im.ico.getimage((256, 256))
img256.save('${tmpPng}')
"`);
      rasterBuffer = fs.readFileSync(tmpPng);
      fs.unlinkSync(tmpIco);
      fs.unlinkSync(tmpPng);
      width = 256;
      height = 256;
    } else if (item.format === 'svg') {
      const meta = await sharp(origBuffer).metadata();
      width = meta.width || 512;
      height = meta.height || 512;
    } else {
      const meta = await sharp(origBuffer).metadata();
      width = meta.width;
      height = meta.height;
    }

    console.log(`    Dimensions: ${width}x${height}, format: ${item.format}`);

    const { card512, list128, list64 } = await processImageVariants(rasterBuffer, item.format === 'svg');

    fs.writeFileSync(path.join(outDir, 'card-512.png'), card512);
    fs.writeFileSync(path.join(outDir, 'list-128.png'), list128);
    fs.writeFileSync(path.join(outDir, 'list-64.png'), list64);

    // Compatibility file under public/logos/uae/<slug>.png
    fs.writeFileSync(path.join('public/logos/uae', `${slug}.png`), list128);

    const sha256 = computeSha256(origBuffer);
    const retrievedAt = new Date().toISOString();

    const manifestItem = {
      status: item.status,
      source_url: item.source_url,
      source_tier: item.source_tier,
      retrieved_at: retrievedAt,
      format: item.format,
      width,
      height,
      sha256,
      license_note: item.license_note,
      files: {
        original: `/logos/${slug}/original.${origExt}`,
        card: `/logos/${slug}/card-512.png`,
        list: `/logos/${slug}/list-64.png`,
        list2x: `/logos/${slug}/list-128.png`
      },
      entity_check: item.entity_check
    };

    manifest.items[slug] = manifestItem;

    logosJson[slug] = {
      status: item.status,
      source: item.source_url,
      source_tier: item.source_tier,
      size: [width, height],
      format: item.format,
      license_note: item.license_note,
      files: manifestItem.files
    };
  }

  // Handle OnDemand extra assets if needed
  // on-demand already processed as item in RESOLVED_ORGS!

  // Now process all 50 orgs from orgs.json to handle unresolved monograms
  console.log('\nProcessing unresolved orgs (monograms)...');
  for (const org of orgs) {
    const slug = org.id;
    if (manifest.items[slug]) {
      continue; // already resolved
    }

    manifest.unresolved.push(slug);

    const outDir = path.join('public/logos', slug);
    fs.mkdirSync(outDir, { recursive: true });

    const initials = getInitials(org.name);
    const monogramSvg = makeMonogramSvg(initials);
    const monogramPath = path.join(outDir, 'monogram.svg');
    fs.writeFileSync(monogramPath, monogramSvg, 'utf8');

    // Also generate original.svg and variants for the monogram
    fs.writeFileSync(path.join(outDir, 'original.svg'), monogramSvg, 'utf8');

    const svgBuf = Buffer.from(monogramSvg);
    const { card512, list128, list64 } = await processImageVariants(svgBuf, true);

    fs.writeFileSync(path.join(outDir, 'card-512.png'), card512);
    fs.writeFileSync(path.join(outDir, 'list-128.png'), list128);
    fs.writeFileSync(path.join(outDir, 'list-64.png'), list64);

    const reason = UNRESOLVED_REASONS[slug] || `no verified official logo retrievable for domain ${org.website || 'unavailable'}`;
    const sha256 = computeSha256(svgBuf);
    const sourceUrl = (org.website && org.website !== 'unavailable') ? `https://${org.website}` : 'none';

    const manifestItem = {
      status: 'monogram',
      source_url: sourceUrl,
      source_tier: 'monogram',
      retrieved_at: new Date().toISOString(),
      format: 'svg',
      width: 512,
      height: 512,
      sha256,
      license_note: 'Placeholder monogram identity; no official logo published',
      files: {
        original: `/logos/${slug}/original.svg`,
        card: `/logos/${slug}/card-512.png`,
        list: `/logos/${slug}/list-64.png`,
        list2x: `/logos/${slug}/list-128.png`,
        monogram: `/logos/${slug}/monogram.svg`
      },
      entity_check: `Entity monogram placeholder generated for ${org.name} (${reason})`
    };

    manifest.items[slug] = manifestItem;

    logosJson[slug] = {
      status: 'monogram',
      source: sourceUrl,
      source_tier: 'monogram',
      size: [512, 512],
      format: 'svg',
      license_note: manifestItem.license_note,
      files: manifestItem.files,
      reason
    };
  }

  // Write manifest.json
  fs.writeFileSync('public/logos/manifest.json', JSON.stringify(manifest, null, 2));
  console.log('Saved public/logos/manifest.json');

  // Write src/data/uae_cc_v1/logos.json
  fs.writeFileSync('src/data/uae_cc_v1/logos.json', JSON.stringify(logosJson, null, 2));
  console.log('Saved src/data/uae_cc_v1/logos.json');

  console.log(`\nSummary:
  Resolved: ${RESOLVED_ORGS.filter(o => o.id !== 'on-demand').length} (plus on-demand engine credit)
  Unresolved: ${manifest.unresolved.length}
  Total orgs in logos.json: ${Object.keys(logosJson).length}
  `);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
