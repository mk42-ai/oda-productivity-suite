"""Builds data/social/sources.json: per company X queries, Reddit queries + subreddits, Instagram usernames, match terms, context guards."""
import json,os,re
R=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PF=json.load(open(f'{R}/data/portfolio.json'))['companies']; PPL=json.load(open(f'{R}/data/people.json'))['people']
O={'lambda':(['"Lambda" GPU cloud','LambdaAPI','"Lambda Labs"','Lambda superintelligence cloud'],['Lambda Labs','LambdaAPI','Lambda Cloud','Lambda GPU','Lambda Inc','@lambdaapi','Stephen Balaban']),
'palebluedot':(['PaleBlueDot AI'],['PaleBlueDot','Pale Blue Dot AI']),'dream-labs':(['"Dream Labs" AI'],['Dream Labs']),'1au':(['"1AU Technologies"'],['1AU Technologies','1AU photonics']),
'grace-investment-machine':(['"Grace Investment Machine"'],['Grace Investment Machine']),'seltz':(['Seltz AI'],['Seltz AI','seltz.ai']),'cadence':(['"Cadence" remote patient monitoring'],['Cadence Care','cadence.care','Cadence remote patient']),
'solar-square':(['SolarSquare','"Solar Square" rooftop'],['SolarSquare','Solar Square']),'star-catcher':(['"Star Catcher" space power'],['Star Catcher']),'reflection':(['"Reflection AI"','Misha Laskin Reflection'],['Reflection AI','ReflectionAI','Misha Laskin']),
'knox':(['"Knox Systems"','Knox FedRAMP'],['Knox Systems']),'axiom':(['"Axiom Math"','Carina Hong Axiom'],['Axiom Math','AxiomMath','Carina Hong']),'oro-labs':(['"ORO Labs" procurement'],['ORO Labs','Oro Labs']),
'numerion-labs':(['"Numerion Labs"','Atomwise'],['Numerion','Atomwise']),'code-metal':(['"Code Metal" AI'],['Code Metal']),'lunar-energy':(['"Lunar Energy" home battery'],['Lunar Energy']),
'karman-industries':(['"Karman Industries"'],['Karman Industries']),'positive-development':(['"Positive Development" autism'],['Positive Development']),'lumara-health':(['"Lumara Health"'],['Lumara Health']),
'insilico-medicine':(['"Insilico Medicine"','Insilico rentosertib','Alex Zhavoronkov'],['Insilico','Zhavoronkov']),'turno':(['Turno electric vehicles India'],['Turno']),'goodfire':(['"Goodfire AI"','Goodfire interpretability'],['Goodfire']),
'overstory':(['Overstory vegetation utilities'],['Overstory']),'solve-therapeutics':(['"Solve Therapeutics"'],['Solve Therapeutics']),'carro':(['Carro Singapore cars'],['Carro']),'poolside':(['"Poolside AI"','poolside AI coding'],['poolside']),
'curbwaste':(['CurbWaste'],['CurbWaste']),'evenup':(['EvenUp AI legal'],['EvenUp']),'judi-rx':(['"Judi Health"','Capital Rx Judi'],['Judi Health','Judi Rx','Capital Rx']),
'perplexity-ai':(['"Perplexity AI"','perplexity_ai','Perplexity Comet browser','Aravind Srinivas','Perplexity funding'],['Perplexity','Aravind Srinivas']),'isaac-health':(['"Isaac Health"'],['Isaac Health']),
'ninja-van':(['"Ninja Van"','NinjaVan'],['Ninja Van','NinjaVan']),'starburst-data':(['Starburst Trino','"Starburst Data"'],['Starburst Data','Starburst Galaxy','Starburst Trino','@starburstdata']),
'turbine':(['"Turbine Finance"'],['Turbine Finance']),'gable':(['"Gable AI" data contracts'],['Gable AI','Gable.ai']),'goose':(['"Goose" pet care app'],['Goose pet']),'brik':(['Brik Indonesia'],['Brik']),
'apptronik':(['Apptronik','Apptronik Apollo humanoid','Jeff Cardenas Apptronik'],['Apptronik','Jeff Cardenas']),'meesho':(['Meesho','Meesho IPO','Vidit Aatrey','Meesho sale'],['Meesho','Vidit Aatrey']),
'wildfire':(['"Wildfire Systems"'],['Wildfire Systems']),'baichuan':(['Baichuan AI','Baichuan model'],['Baichuan','百川']),'levelten':(['"LevelTen Energy"'],['LevelTen']),'percent':(['"Percent" private credit'],['Percent private credit','percent.com']),
'grit':(['"GRIT Bio"','Grit Biotechnology'],['GRIT Bio','Grit Biotechnology']),'fountain':(['Fountain hourly hiring platform'],['Fountain hiring','fountain.com']),'floor-nfts':(['Floor NFT app'],['Floor app','Floor NFT']),
'extend':(['paywithextend virtual cards'],['paywithextend','Extend virtual card']),'remote':(['Remote.com','Job van der Voort Remote'],['Remote.com','Job van der Voort']),'lively':(['Lively HSA'],['Lively HSA','livelyme']),
'branch-international':(['Branch International loans','branch_co'],['Branch International','@branch_co']),'forest':(['Forest-PKG packaging'],['Forest-PKG']),'iru':(['Iru Kandji'],['Iru']),'sharpa':(['Sharpa robotics hand'],['Sharpa']),
'tacta':(['Tacta Systems'],['Tacta']),'writer':(['"Writer AI"','get_writer','May Habib Writer'],['Writer AI','@get_writer','May Habib','WRITER AI']),'when':(['"When" COBRA benefits'],['When Inc']),
'figment':(['Figment staking'],['Figment']),'pendo':(['Pendo.io','Pendo product analytics'],['Pendo']),'phenom-people':(['Phenom HR AI','Phenom People'],['Phenom']),'deferred':(['Deferred 1031 exchange'],['Deferred.com','Deferred 1031']),
'cloudwise':(['Cloudwise China'],['Cloudwise']),'precision-neuro':(['"Precision Neuroscience"'],['Precision Neuroscience']),'odeko':(['Odeko coffee'],['Odeko'])}
CTX={'nalu':r'nalu medical|neuromod|peripheral nerve|chronic pain|nalumed','yalo':r'yalochat|yalo ai|conversational commerce|whatsapp','seltz':r'seltz\.ai|seltz ai','brik':r'brik\.id|indonesia|building material|bahan bangunan','iru':r'kandji|iru platform|endpoint|identity|@iru',
'remote':r'remote\.com|job van der voort|@remote\b|employer of record|\beor\b|marcelo lebre','pendo':r'pendo\.io|@pendoio|pendo\'s|product analytics|todd olson|pendo ai|in-app guide','phenom-people':r'phenom people|@phenompeople|talent experience|\bhr\b|recruit|hiring|phenom ai',
'knox':r'knox systems|fedramp','carro':r'carro\.sg|carro singapore|carro\'s|used-car|used car|aaron tan|singapore','figment':r'staking|validator|crypto|blockchain|ethereum|solana|figment\'s|lorien gabel','goose':r'\bpet','overstory':r'vegetation|utilit|wildfire|satellite|overstory ai|tree',
'grit':r'grit bio|grit biotech|car-?t','cloudwise':r'observability|aiops|博睿','deferred':r'1031|deferred\.com','lively':r'\bhsa\b','turbine':r'turbine finance','sharpa':r'robot|hand|dexter|humanoid','when':r'cobra|when inc|getwhen','percent':r'private credit|percent\.com',
'insilico-medicine':r'insilico medicine|zhavoronkov|rentosertib|ism\d|drug|\bai\b|biotech|pharma|ipo|hong kong|@insilicomeds','reflection':r'reflection ai','poolside':r'\bai\b|model|coding|jason warner|eiso kant|agent|llm|frontier','star-catcher':r'space|power|beam|satellite|orbit',
'dream-labs':r'\bai\b|startup|raise|funding|b capital|series|seed','inspace':r'inspacestack|inspace stack','infrahub':r'infrahub\.ai','carrick':r'carrick therapeutics|samuraciclib|oncology|cancer|cdk7','turno':r'\bev\b|electric|three-?wheeler|turno\.club|fintech|battery|funding',
'flourish-health':r'behavioral|substance|addiction|recovery|medicaid|flourish\.health|b capital','xingyun':r'xingyun group|行云|cross-border|ipo','lambda':r'gpu|cloud|\bai\b|compute|nvidia|lambda labs|superintelligence|data ?cent|h100|b200|ipo','odeko':r'odeko','extend':r'extend|virtual card',
'lunar-energy':r'lunar energy (inc|bridge|system)|home (battery|energy)|kunal girotra|gridshare|solar|battery','positive-development':r'positive development (inc|clinic|autism)|positivedevelopment|floortime','volastra':r'volastra therapeutics|volastratx|kif18a|oncology|cancer',
'isaac-health':r'isaac health|dementia|memory|cognitive|brain health','certn':r'background check|certn'}
SECTOR_SUBS={'biotech':['biotech','biotechnology','longevity','drugdiscovery'],'healthtech':['healthIT','healthcare','digitalhealth'],'fintech':['fintech','CryptoCurrency','IndiaInvestments'],'robotics':['robotics','humanoidrobots','space','aviation'],
'climate':['energy','RenewableEnergy','geothermal','solar'],'ai-infra':['MachineLearning','LocalLLaMA','hardware','quantum'],'edtech':['edtech','education'],'logistics':['logistics','supplychain','singapore'],'consumer':['india','IndianStreetBets','indonesia'],'ai-enterprise':['artificial','SaaS','OpenAI','ProductManagement']}
GLOBAL_SUBS=['venturecapital','startups','fintech']
IG={'pendo':'pendo.io','perplexity-ai':'perplexity.ai','certn':'certn.co','lively':'wearlively','phenom-people':'phenompeople','curbwaste':'getcurbwaste','perimeter-81':'perimeter81','mswipe':'mswipe_technologies','branch-international':'branchapp',
 'meesho':'meeshoapp','ninja-van':'ninjavan_my','apptronik':'apptronik','kopi-kenangan':'kopikenangan.id','coindcx':'coindcx','flutterwave':'theflutterwaveco','innovaccer':'innovaccer','khatabook':'khatabook','bhanzu':'bhanzu_official','sugarfit':'sugarfit_official',
 'figment':'figment_io','remote':'remote.com','6sense':'6sense','labelbox':'labelbox','dailyhunt':'dailyhunt','solar-square':'solarsquare.in','carro':'carro.sg','rapyd':'rapyd_net','writer':'get_writer','trm-labs':'trmlabs','fervo-energy':'fervoenergy','jetzero':'jetzeroaero'}
F={}
for p in PPL:
    if p['kind']=='founder': F.setdefault(p['company_slug'],[]).append(p['name'])
out=[]
for c in PF:
    s=c['slug']; n=c['name']
    q,t=O.get(s,([f'"{n}"'],[n]))
    xh=(c.get('x') or '').rstrip('/').split('/')[-1] if c.get('x') else None
    xq=list(q)+([f'from:{xh}',f'@{xh}'] if xh else [])+[f'"{f}"' for f in F.get(s,[])[:2]]
    if xh: t=list(t)+[f'@{xh}',xh]
    out.append({'slug':s,'name':n,'sector':c['sector'],'x_handle':xh,'x_queries':xq,'reddit_queries':q[:2],'subreddits':GLOBAL_SUBS+SECTOR_SUBS.get(c['sector'],[]),'instagram':IG.get(s),'founders':F.get(s,[])[:4],'match_terms':t,'context_guard':CTX.get(s)})
json.dump({'generated_at':__import__('datetime').datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),'global_subreddits':GLOBAL_SUBS,'sector_subreddits':SECTOR_SUBS,'companies':out},open(f'{R}/data/social/sources.json','w'),indent=1)
print(len(out),sum(len(o['x_queries']) for o in out),sum(1 for o in out if o['instagram']),sum(1 for o in out if o['x_handle']))
