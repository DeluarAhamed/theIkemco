# =============================================================================
# THE IKEM CO. — static site build
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File build.ps1
#
# Reads  : src/_layout.html          the shared chrome
#          src/pages/*.html          one file per unique page
#          src/_neighborhood.html    template for the five area pages
#          src/_service.html         template for the four service pages
#          the data tables below
# Writes : plain static .html files in the project root, ready to deploy
#
# Edit src/, never the generated root .html files. Re run this after any change.
# =============================================================================

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$year = (Get-Date).Year

# Cache buster. Every build stamps the stylesheet and script URLs, so a
# returning visitor is never served yesterday's CSS out of their own cache.
$stamp = Get-Date -Format 'yyyyMMddHHmmss'

# The live origin. Change this one line when the real domain is pointed at the
# site and every canonical tag, Open Graph URL and sitemap entry follows.
$siteUrl = 'https://the-ikemco.vercel.app'

# every page written, collected for the sitemap
$script:builtPages = New-Object System.Collections.Generic.List[string]

function Read-File($p) { Get-Content -Raw -Encoding UTF8 (Join-Path $root $p) }

$layout = Read-File 'src/_layout.html'

# $file is the output filename, $nav is the menu item that should read as current
function Write-Page($file, $nav, $title, $desc, $content) {
  $canonical = if ($file -eq 'index') { "$siteUrl/" } else { "$siteUrl/$file.html" }
  $html = $layout.Replace('{{TITLE}}', $title).
                  Replace('{{DESC}}', $desc).
                  Replace('{{SLUG}}', $nav).
                  Replace('{{YEAR}}', "$year").
                  Replace('{{V}}', $stamp).
                  Replace('{{SITE}}', $siteUrl).
                  Replace('{{CANONICAL}}', $canonical).
                  Replace('{{CONTENT}}', $content)

  # Stamp relative image URLs too. Photography keeps its filename when it is
  # replaced, and a browser that once cached a 404 for a slot will keep
  # serving that 404 and never see the photograph that arrived later.
  # Absolute URLs (og:image) are left alone so shared links stay stable.
  $html = [regex]::Replace($html, '(?<=["''])assets/img/[^"'']+?\.(?:jpg|jpeg|png|svg|webp)', { param($m) $m.Value + '?v=' + $stamp })

  Set-Content -Path (Join-Path $root "$file.html") -Value $html -Encoding UTF8
  $script:builtPages.Add($canonical)
  Write-Host "  $file.html"
}

# --- unique pages ------------------------------------------------------------
Write-Host 'Pages'
Get-ChildItem (Join-Path $root 'src/pages') -Filter *.html | ForEach-Object {
  $raw = Get-Content -Raw -Encoding UTF8 $_.FullName
  $title = ([regex]::Match($raw, '<!--@title\s*(.*?)-->')).Groups[1].Value.Trim()
  $desc = ([regex]::Match($raw, '<!--@desc\s*(.*?)-->')).Groups[1].Value.Trim()
  $nav = ([regex]::Match($raw, '<!--@nav\s*(.*?)-->')).Groups[1].Value.Trim()
  if (-not $nav) { $nav = $_.BaseName }
  $body = [regex]::Replace($raw, '<!--@\w+\s*.*?-->\r?\n?', '')
  Write-Page $_.BaseName $nav $title $desc $body
}

# --- neighborhood pages ------------------------------------------------------
# Add a neighborhood by adding a row here. Nothing else changes.
$neighborhoodTpl = Read-File 'src/_neighborhood.html'

$neighborhoods = @(
  @{ slug = 'ladera-heights'; name = 'Ladera Heights'; n = '01'; tone = ''
     lede = 'The pocket between Culver City and the Baldwin Hills ridge, where Westside money quietly went to get more house.'
     body1 = 'Ladera sits in a rare position on the map. Close enough to the studios, the airport and the Westside that the commute never becomes an argument, far enough up the hill that the streets stay quiet. Mid century floor plans on generous lots, wide setbacks, and a long history of owners who simply do not sell.'
     body2 = 'Inventory is thin by design, not by accident. When something good comes up it is often placed rather than listed, which is exactly the kind of transaction this practice is built for. If Ladera is your target, the work starts long before a listing appears.'
     watch = 'Lot orientation and the slope at the back of the property. Two houses on the same street can have entirely different buildable futures.'
     median = '$1.6M'; dom = '21'; ask = '102%'
     sales = @(
       @{ a = 'Hillcrest Modern'; s = 'Sold, represented buyer'; p = '$3,100,000' },
       @{ a = 'Sherbourne Drive'; s = 'Sold, represented seller'; p = '$1,850,000' },
       @{ a = 'Ladera Crest'; s = 'Sold, off market'; p = '$2,240,000' }
     )
  },
  @{ slug = 'view-park'; name = 'View Park'; n = '02'; tone = ' is-dark'
     lede = 'A listed historic district with a skyline view, and the strictest design review in the corridor.'
     body1 = 'View Park is on the National Register, and it shows. Spanish revival, Tudor and period modern homes on curving streets, with a downtown view most buyers do not expect the first time they drive up the hill. The housing stock has been cared for by families who have held it for generations.'
     body2 = 'Historic designation protects that character and complicates renovation. Knowing which changes will clear review and which will not is the difference between a smart purchase and a two year delay. I have walked clients through both outcomes and I will tell you honestly which one you are buying.'
     watch = 'Anything the previous owner added without permits. In a historic district that is not a small problem to unwind.'
     median = '$1.9M'; dom = '18'; ask = '105%'
     sales = @(
       @{ a = 'Angeles Vista Compound'; s = 'Active, listed'; p = '$2,995,000' },
       @{ a = 'Presidential Row'; s = 'Sold, off market'; p = '$2,650,000' },
       @{ a = 'Valley Ridge'; s = 'Sold, represented buyer'; p = '$1,780,000' }
     )
  },
  @{ slug = 'windsor-hills'; name = 'Windsor Hills'; n = '03'; tone = ''
     lede = 'The same ridge, the same history, and a market where four sales can set the tone for a year.'
     body1 = 'Windsor Hills shares the ridge and much of the architecture with View Park, and often the same buyers. Tenure here is long. Families hold for decades, pass property down, and stay. The result is a market that moves on very few data points.'
     body2 = 'For a buyer, patience is the strategy and relationships are the edge. For a seller, preparation is everything, because the pool of buyers is small, informed, and has been watching this street for years.'
     watch = 'Comparable sales that are eighteen months old. In a market this thin, stale comps mislead both sides of the table.'
     median = '$1.3M'; dom = '24'; ask = '101%'
     sales = @(
       @{ a = 'Enlow Place'; s = 'Sold, represented seller'; p = '$1,425,000' },
       @{ a = 'Hillcrest Drive'; s = 'Sold, represented buyer'; p = '$1,190,000' },
       @{ a = 'Overhill Court'; s = 'Sold, off market'; p = '$1,560,000' }
     )
  },
  @{ slug = 'baldwin-hills'; name = 'Baldwin Hills'; n = '04'; tone = ' is-clay'
     lede = 'Ridge line views, a national landmark, and the most underrated commute in Los Angeles.'
     body1 = 'The ridge holds some of the best unobstructed views in the city. Below it sits the Village Green, a national historic landmark that trades on logic entirely its own, and a mix of post war stock and newer construction that rewards anyone willing to look past the first block.'
     body2 = 'Proximity is the asset buyers undervalue here. Clients who work at the studios, downtown or near the airport figure that out in a single afternoon of driving, and then they stop looking anywhere else.'
     watch = 'Geology. Parts of these hills have a history worth reading before you fall in love with a view lot.'
     median = '$1.1M'; dom = '27'; ask = '99%'
     sales = @(
       @{ a = 'Ridgeline Estate'; s = 'Off market, available privately'; p = 'Upon request' },
       @{ a = 'Don Lorenzo Drive'; s = 'Sold, represented buyer'; p = '$1,340,000' },
       @{ a = 'Village Green'; s = 'Sold, represented seller'; p = '$640,000' }
     )
  },
  @{ slug = 'leimert-park'; name = 'Leimert Park'; n = '05'; tone = ''
     lede = 'The cultural heart of Black Los Angeles, with a 1920s plan that largely survived intact.'
     body1 = 'Leimert Park is one of very few neighborhoods in this city where the architecture, the street plan and the community all arrived together and stayed. Spanish and Tudor revival homes, walkable blocks, and a commercial village that has carried a culture for decades.'
     body2 = 'The new rail stop has changed the conversation, and so has a wave of buyers who want to be part of the place rather than merely near it. Income property here deserves a serious look, and so does the responsibility that comes with buying in a neighborhood that means something.'
     watch = 'Duplex and triplex stock that has been informally converted. The income is real, the paperwork often is not.'
     median = '$950K'; dom = '22'; ask = '103%'
     sales = @(
       @{ a = 'Degnan Boulevard Duplex'; s = 'Sold, income property'; p = '$1,475,000' },
       @{ a = 'Norton Avenue'; s = 'Sold, represented buyer'; p = '$985,000' },
       @{ a = 'Leimert Boulevard'; s = 'Sold, represented seller'; p = '$1,120,000' }
     )
  }
)

Write-Host 'Neighborhoods'
foreach ($h in $neighborhoods) {
  $sales = ($h.sales | ForEach-Object {
    "        <li><span>$($_.a)</span><span class=""st"">$($_.s)</span><span class=""amt"">$($_.p)</span></li>"
  }) -join "`n"

  $others = ($neighborhoods | Where-Object { $_.slug -ne $h.slug } | ForEach-Object {
    "        <a class=""hood"" href=""$($_.slug).html""><div class=""hood-media""><div class=""frame ratio-4x5$($_.tone)"" data-slug=""$($_.name)""><img src=""assets/img/hood-$($_.slug).jpg"" alt=""$($_.name)"" onerror=""this.classList.add('missing')""></div></div><h3>$($_.name)</h3></a>"
  }) -join "`n"

  # a pale frame needs dark contour lines, a dark or clay frame needs pale ones
  $ridgeTone = if ($h.tone -eq '') { 'light' } else { 'dark' }

  # split the snapshot figures so the counters can animate the numeric part
  $medianNum = ($h.median -replace '[^0-9.]', '')
  $medianUnit = ($h.median -replace '[0-9.$]', '')
  $medianDec = if ($medianNum -match '\.') { '1' } else { '0' }
  $askNum = ($h.ask -replace '[^0-9.]', '')

  $content = $neighborhoodTpl.Replace('{{NAME}}', $h.name).
                              Replace('{{RIDGETONE}}', $ridgeTone).
                              Replace('{{SLUG}}', $h.slug).
                              Replace('{{N}}', $h.n).
                              Replace('{{TONE}}', $h.tone).
                              Replace('{{LEDE}}', $h.lede).
                              Replace('{{BODY1}}', $h.body1).
                              Replace('{{BODY2}}', $h.body2).
                              Replace('{{WATCH}}', $h.watch).
                              Replace('{{MEDIANNUM}}', $medianNum).
                              Replace('{{MEDIANUNIT}}', $medianUnit).
                              Replace('{{MEDIANDEC}}', $medianDec).
                              Replace('{{MEDIAN}}', $h.median).
                              Replace('{{DOM}}', $h.dom).
                              Replace('{{ASKNUM}}', $askNum).
                              Replace('{{ASK}}', $h.ask).
                              Replace('{{SALES}}', $sales).
                              Replace('{{OTHERS}}', $others)

  Write-Page $h.slug 'neighborhoods' "$($h.name) Real Estate" "$($h.name) market intelligence, past sales and private representation from Ikem." $content
}

# --- service pages -----------------------------------------------------------
$serviceTpl = Read-File 'src/_service.html'

$services = @(
  @{ slug = 'sports-entertainment'; name = 'Sports and Entertainment'; n = '01'; tone = ' is-dark'
     lede = 'Representation shaped around a career, not a calendar.'
     body1 = 'Trade windows, production schedules, signing timelines and the privacy requirements that come with a public name. I have moved clients in the middle of a season and in the middle of a shoot, and the planning for both starts months before anyone tours a house.'
     body2 = 'Relocation is handled from end to end. Schools, security review, staff, storage, vehicles, the vendor list, and the parts nobody thinks about until the first week in a new city. Your agent, your business manager and your attorney are in the conversation from the first call, not handed a signed contract to react to.'
     points = @(
       @{ t = 'Privacy by structure'; d = 'Trusts and entities set up with your attorney before an offer is written, not after your name is in public records.' },
       @{ t = 'Timing against the contract'; d = 'Purchases and sales planned around guaranteed money, option years and the real chance of a trade.' },
       @{ t = 'Relocation, complete'; d = 'One person coordinating the move, the vendors and the first ninety days in a new market.' },
       @{ t = 'Six state coverage'; d = 'When you sign somewhere new, you keep the same advisor instead of a referral to a stranger.' }
     )
  },
  @{ slug = 'commercial'; name = 'Commercial Real Estate'; n = '02'; tone = ''
     lede = 'Turning earnings into something that outlasts the earning years.'
     body1 = 'Income property, land and owner user buildings for clients who are past the first house and thinking about the next thirty years. The work is underwriting, honestly and alongside your business manager, rather than selling you a story about a cap rate.'
     body2 = 'I will tell you when the numbers do not hold, when the tenancy risk is larger than the broker is letting on, and when the right answer is to wait. Clients who have heard that from me once tend to bring me everything afterward.'
     points = @(
       @{ t = 'Underwriting review'; d = 'Rent rolls, expenses and hold assumptions checked against what the asset actually does, not what the offering memorandum says.' },
       @{ t = 'Owner user acquisitions'; d = 'Buying the building your own business operates from, structured with your accountant.' },
       @{ t = 'Land and development sites'; d = 'Entitlement risk explained in plain terms before you commit capital.' },
       @{ t = 'Disposition strategy'; d = 'Exit timing, exchange planning and who the real buyer pool is.' }
     )
  },
  @{ slug = 'property-management'; name = 'Property Management'; n = '03'; tone = ' is-clay'
     lede = 'Stewardship of the assets you own and would rather not think about.'
     body1 = 'For clients on location, on the road or simply elsewhere. Vetted vendors, scheduled maintenance, tenant relations and one monthly report that tells you what happened, what it cost and what is coming.'
     body2 = 'The point is not to send you more information. The point is that nothing reaches you that does not need to, and that the things which do reach you arrive with a recommendation attached.'
     points = @(
       @{ t = 'One monthly report'; d = 'Written by a person, not exported from software. What happened, what it cost, what is next.' },
       @{ t = 'A vendor list that is actually vetted'; d = 'The trades I use on my own clients homes, held to the same standard.' },
       @{ t = 'Tenant relations'; d = 'Screening, leases, renewals and the difficult conversations, handled without your name in them.' },
       @{ t = 'Empty house protocol'; d = 'Security, landscaping, systems checks and seasonal work for the home you are not living in this year.' }
     )
  },
  @{ slug = 'construction-advisory'; name = 'Construction Advisory'; n = '04'; tone = ' is-dark'
     lede = 'Someone on your side of the table while the money is being spent.'
     body1 = 'Ground up builds, full renovations and the targeted pre sale work that actually moves a number. Builder selection, budget review, permit expectations and site oversight, so the project runs on a schedule someone other than the contractor believes in.'
     body2 = 'Most cost overruns are visible in the first three weeks of a project, in the contract and the allowances, long before anyone breaks ground. That is when I want to be involved.'
     points = @(
       @{ t = 'Builder selection'; d = 'Bids compared line by line, references called, and the questions asked that owners do not know to ask.' },
       @{ t = 'Budget and allowances'; d = 'Where the six figure surprises hide, and the three line items worth arguing about before you sign.' },
       @{ t = 'Permit reality'; d = 'An honest read on timelines, especially inside a historic district or on a hillside lot.' },
       @{ t = 'Pre sale improvement'; d = 'The short list of work that returns more than it costs, and the long list that does not.' }
     )
  }
)

Write-Host 'Services'
foreach ($s in $services) {
  $points = ($s.points | ForEach-Object {
    "        <div class=""index-row"" style=""cursor:default""><span class=""idx"">&bull;</span><h3>$($_.t)</h3><p class=""row-note"">$($_.d)</p><span class=""row-go""></span></div>"
  }) -join "`n"

  $others = ($services | Where-Object { $_.slug -ne $s.slug } | ForEach-Object {
    "        <a class=""index-row"" href=""$($_.slug).html""><span class=""idx"">$($_.n)</span><h3>$($_.name)</h3><p class=""row-note"">$($_.lede)</p><span class=""row-go"">&#8599;</span></a>"
  }) -join "`n"

  $content = $serviceTpl.Replace('{{NAME}}', $s.name).
                         Replace('{{SLUG}}', $s.slug).
                         Replace('{{N}}', $s.n).
                         Replace('{{TONE}}', $s.tone).
                         Replace('{{LEDE}}', $s.lede).
                         Replace('{{BODY1}}', $s.body1).
                         Replace('{{BODY2}}', $s.body2).
                         Replace('{{POINTS}}', $points).
                         Replace('{{OTHERS}}', $others)

  Write-Page $s.slug 'services' $s.name $s.lede $content
}

# --- journal articles --------------------------------------------------------
# Add an article by adding a row here. The journal index and the related links
# at the foot of every article rebuild themselves from this table.
$articleTpl = Read-File 'src/_article.html'

$articles = @(
  @{ slug = 'offer-questions'; category = 'Ownership'; read = '6'; tone = ''; image = 'journal-01.jpg'
     title = 'What a business manager should ask before you write an offer'
     dek = 'Five questions that change the structure of a purchase, and why they almost never get asked in time.'
     body = @(
       'By the time most business managers see a purchase, the offer is written and the client is emotionally committed. At that point the conversation is about damage control, not structure. Here are the five questions worth asking a week earlier.'
       @{ h = 'One. Whose name is going on this' }
       'Title is a public record in California. If the answer is going to be a trust or an entity, it has to exist before the offer, not after the close. Amending title afterwards creates a second record pointing straight at the first, which defeats the purpose and costs money twice.'
       @{ h = 'Two. Where is the money actually coming from' }
       'Cash, financing, a securities backed line, a distribution that lands in March. Each one changes the offer. A seller reading two identical numbers will take the one with the shorter and more certain path, and I would rather structure that before we are competing than explain it after we have lost.'
       @{ q = 'A seller is not choosing a number. A seller is choosing certainty.' }
       @{ h = 'Three. What happens to this asset if the career changes' }
       'A trade, a cancelled show, a company that does not sell. The question is not pessimism, it is underwriting. If the answer is that the property becomes a problem, we should know the exit before we know the address.'
       @{ h = 'Four. What are the real carrying costs' }
       'Taxes at the reassessed value rather than the seller''s old basis, insurance in a fire zone, a pool, landscaping on a hillside, staff, a management arrangement while the client is on location. I have watched more people get uncomfortable about the monthly than about the purchase price.'
       @{ h = 'Five. Who is going to hold the relationship afterwards' }
       'Someone has to own the vendor list, the warranty file, the permit history and the renewal dates. If that person is not named on the day of closing, it becomes nobody, and three years later a straightforward sale takes four months because the paperwork has to be reassembled.'
       'None of these are difficult questions. They are simply easier to answer before there is a deadline attached to them. Ask them early and the transaction gets quieter, which is usually what the client wanted in the first place.'
     )
  },
  @{ slug = 'view-park-value'; category = 'Neighborhoods'; read = '8'; tone = ' is-dark'; image = 'journal-02.jpg'
     title = 'Why View Park holds value when the rest of the map moves'
     dek = 'Historic designation, long tenure ownership and the arithmetic of genuinely scarce inventory.'
     body = @(
       'Every few years somebody asks me why View Park does not behave like the neighborhoods around it. Prices move less in a correction and recover faster afterwards. The reason is not sentiment. It is supply, and it is structural.'
       @{ h = 'The inventory is small and it does not grow' }
       'View Park sits on the National Register as a historic district. The housing stock is largely what it was when it was built, and the review process makes meaningful expansion slow and expensive. There is no mechanism by which a hundred new units appear here next year. In a city built on the idea that supply eventually answers demand, that is unusual.'
       @{ h = 'Tenure is measured in decades' }
       'Families hold here. Property passes down rather than trading. In any given year the number of sales is small enough that a handful of transactions set the tone, which means the market is thin in both directions. Thin markets fall less on the way down because there are fewer forced sellers, and they rise sharply when demand arrives because there is nothing to absorb it.'
       @{ q = 'Four sales can set the tone for a year. That cuts both ways, and most buyers only ever think about one of them.' }
       @{ h = 'The buyer pool is informed' }
       'People do not stumble into View Park. They have usually been driving these streets for years before they make an offer. Informed buyers do not panic, and they do not overpay for the wrong house, which keeps the comparable sales honest.'
       @{ h = 'What this means if you are buying' }
       'Patience is the strategy, and relationships are the edge. A meaningful share of what trades here is placed rather than listed. If View Park is your target, the work starts long before an address appears anywhere public, and it consists mostly of being the person a seller''s family thinks of first.'
       @{ h = 'What it means if you are selling' }
       'Preparation matters more than marketing. The pool is small and it is knowledgeable, so a house that has been thoughtfully readied will be recognised, and one that has not will be discounted precisely and without much negotiation.'
       'One caution. Stale comparable sales mislead badly in a market this thin. A price built on a sale from eighteen months ago is a price built on a different market, and I have seen that cost people on both sides of the table.'
     )
  },
  @{ slug = 'buying-privately'; category = 'Privacy'; read = '5'; tone = ''; image = 'journal-03.jpg'
     title = 'Buying a home without your name on anything'
     dek = 'Trusts, entities and the practical limits of privacy in a public records state.'
     body = @(
       'Almost every client asks a version of the same question in the first meeting. Some ask it directly. Most circle it for twenty minutes and then say something like, will anyone be able to find out.'
       'The honest answer is that California is a public records state and the deed is a public record. What you can control is what that record says, who it points to, and how much work it takes to connect it back to you. That is not nothing. In practice it is most of what people actually want.'
       @{ h = 'What a trust does and does not do' }
       'Holding title in a trust is the most common approach and the most commonly misunderstood. A revocable trust named after you offers no privacy at all. A trust named after the street, a family word, or nothing in particular offers a great deal, because the public record shows the trust name and the trustee, and a well structured arrangement puts your attorney or a corporate trustee in that seat.'
       'This has to be set up before the offer goes out. Amending title after the fact creates a second public record that points directly at the first one, which is the opposite of the goal.'
       @{ q = 'The mistake is almost never the structure. It is the timing.' }
       @{ h = 'Entities, and when they are worth it' }
       'A limited liability company can hold residential property, and for clients who already have one for other reasons it is sometimes the cleaner answer. It comes with costs: annual filings, franchise tax, lender resistance, and in some cases a loss of the homeowner exemption. For an income property that math usually works. For a primary residence it often does not.'
       @{ h = 'The part nobody talks about' }
       'Structure protects the record. It does not protect against people. The listing agent knows. The photographer knows. The inspector, the appraiser, the contractor and the neighbour who watched the tour all know something. This is where an off market transaction earns its keep, and where the choice of who represents you matters more than any document.'
       @{ h = 'What I would do' }
       'Set up the entity or trust early, with your attorney, before we write anything. Keep the buying party small. Choose a representation approach that limits how many people have to be told. And accept that perfect invisibility is not available, so aim instead for a record that takes serious effort to unwind and a process that gives almost nobody a reason to try.'
     )
  },
  @{ slug = 'renovation-budget'; category = 'Building'; read = '7'; tone = ' is-clay'; image = 'journal-04.jpg'
     title = 'The renovation numbers that never make it into the budget'
     dek = 'Where six figure surprises hide, and the three line items worth arguing about before you sign.'
     body = @(
       'Most cost overruns are visible in the first three weeks of a project, in the contract and the allowances, long before anyone breaks ground. By the time they show up on an invoice they have been sitting in the paperwork for months.'
       @{ h = 'Allowances are not estimates' }
       'An allowance is a placeholder the builder inserts because a decision has not been made. Tile at fifteen dollars a square foot. Plumbing fixtures at a number nobody has tested against what you actually like. Every allowance in a contract is a future conversation about more money, and the honest way to handle it is to price the things you genuinely want before signing, not after.'
       @{ h = 'The site is the risk, not the house' }
       'On a hillside lot, the expensive words are grading, shoring, drainage and geology. On a flat lot in an older neighbourhood they are sewer lateral, panel upgrade and soil. None of these improve a single room, and all of them can move a budget by six figures. A soils report before you close costs a fraction of what it costs to discover the same information in month four.'
       @{ q = 'Nobody has ever regretted spending four thousand dollars to avoid a four hundred thousand dollar surprise.' }
       @{ h = 'Permits are a schedule item, not a formality' }
       'Inside a historic district, or on anything visible from the street in a design reviewed area, the approval path is the project schedule. I have watched clients carry two mortgages for a year because a builder quoted a construction timeline and quietly left the entitlement timeline out of it. Ask for both, separately, in writing.'
       @{ h = 'The three worth arguing about' }
       'First, the change order process. Who approves, in what form, and how fast. Second, the schedule of values, so payments track completed work rather than the calendar. Third, the definition of substantially complete, because that single phrase decides when the money stops.'
       @{ h = 'Pre sale work is a different calculation entirely' }
       'If you are improving to sell, the list of work that returns more than it costs is short. Paint, landscape, light, and the one room that is obviously wrong. The long list of everything else usually returns less than eighty cents on the dollar, and I will tell you which list your idea is on before you spend anything.'
     )
  },
  @{ slug = 'off-market'; category = 'Market'; read = '4'; tone = ''; image = 'journal-05.jpg'
     title = 'Off market does not mean off limits'
     dek = 'How quiet inventory actually circulates in Los Angeles, and how to be on the right list.'
     body = @(
       'Buyers hear off market and picture a secret database. There is no database. There is a set of people who talk to each other, and the question is whether anyone in that set has a reason to think of you.'
       @{ h = 'Why sellers go quiet' }
       'Some do not want strangers walking through the house. Some are settling an estate and would rather not advertise it. Some will move for the right number but are not willing to list at that number and be told no in public. In every case the seller is trading exposure for control, and they are not trying to hide from buyers, they are trying to choose which ones.'
       @{ q = 'Quiet inventory is not hidden from you. It is simply only shown to people somebody already trusts.' }
       @{ h = 'How it actually circulates' }
       'A call between two brokers who have closed together before. A conversation at a property tour. A note to three clients whose requirements are specific enough to remember. That is the whole mechanism. It runs on reputation and on having been specific, and it does not run on alerts.'
       @{ h = 'How to be on the list' }
       'Be precise. A buyer who says anything good in the low three millions is not memorable. A buyer who says a single level on a view lot in View Park, flexible on kitchen, will close in twenty one days, is a phone call I can make the moment something moves. Precision is what makes you easy to place.'
       'Then be reachable and be real. The fastest way off a broker''s list is to be shown something rare and go quiet for two weeks. The fastest way to stay on it is to answer, even when the answer is no, and to say why.'
     )
  },
  @{ slug = 'leimert-rail'; category = 'Community'; read = '5'; tone = ' is-dark'; image = 'journal-06.jpg'
     title = 'What the new rail stop is doing to Leimert Park'
     dek = 'Transit, small business and the difference between investment and displacement.'
     body = @(
       'Leimert Park is one of very few neighbourhoods in this city where the architecture, the street plan and the community all arrived together in the 1920s and largely survived. A rail stop changes the calculation for everyone standing on that plan, and it is worth being precise about how.'
       @{ h = 'What transit actually does to value' }
       'Proximity to a station reliably lifts land value, and it lifts it fastest for the parcels that can be used more intensively. In Leimert that means the commercial spine and the multi unit stock, not the single family blocks, which tend to move later and more gently. Anyone quoting you a single number for the neighbourhood is not looking closely enough.'
       @{ h = 'Income property deserves a serious look' }
       'Duplex and triplex stock here has been quietly held for decades, often by families, often with informal conversions that were never permitted. The income is real. The paperwork frequently is not, and unwinding that is a condition of any clean purchase or refinance. It is solvable, and it is the single thing I check first.'
       @{ q = 'The income is real. The paperwork frequently is not. That gap is the whole diligence.' }
       @{ h = 'The part that is not a spreadsheet' }
       'This neighbourhood means something. It carried a culture through decades when the rest of the city was not paying attention, and the businesses along the village are part of why anyone wants to be here now. A buyer who treats that as an amenity rather than a responsibility tends to be an unhappy owner, and tends to be an unwelcome neighbour.'
       'I say that to clients plainly, including when it costs me the transaction. Buy here because you want to be part of it. If the only reason is the rail stop, there are easier ways to make that bet.'
     )
  }
)

function Render-Body($blocks) {
  ($blocks | ForEach-Object {
    if ($_ -is [hashtable]) {
      if ($_.ContainsKey('h')) { "    <h2>$($_.h)</h2>" }
      elseif ($_.ContainsKey('q')) { "    <blockquote>$($_.q)</blockquote>" }
    } else { "    <p>$_</p>" }
  }) -join "`n"
}

function Render-Card($a) {
  "    <a class=""entry"" href=""$($a.slug).html"">" +
  "<div class=""entry-media""><div class=""frame ratio-3x2$($a.tone)"" data-slug=""$($a.category)""><img src=""assets/img/$($a.image)"" alt="""" onerror=""this.classList.add('missing')""></div></div>" +
  "<p class=""fine"">$($a.category) &middot; $($a.read) min read</p><h3>$($a.title)</h3><p>$($a.dek)</p></a>"
}

Write-Host 'Articles'
foreach ($a in $articles) {
  $related = ($articles | Where-Object { $_.slug -ne $a.slug } | Select-Object -First 3 | ForEach-Object { Render-Card $_ }) -join "`n"
  $content = $articleTpl.Replace('{{TITLE}}', $a.title).
                         Replace('{{SLUG}}', $a.slug).
                         Replace('{{CATEGORY}}', $a.category).
                         Replace('{{READ}}', $a.read).
                         Replace('{{TONE}}', $a.tone).
                         Replace('{{IMAGE}}', $a.image).
                         Replace('{{DEK}}', $a.dek).
                         Replace('{{BODY}}', (Render-Body $a.body)).
                         Replace('{{RELATED}}', $related)
  Write-Page $a.slug 'journal' $a.title $a.dek $content
}

# regenerate the journal index from the same table
$journalCards = ($articles | ForEach-Object { Render-Card $_ }) -join "`n"
$journalRaw = Get-Content -Raw (Join-Path $root 'src/pages/journal.html')
$journalRaw = [regex]::Replace($journalRaw, '(?s)(<div class="grid-journal"[^>]*>).*?(</div>\r?\n  <p class="fine")', ('$1' + "`n" + $journalCards + "`n  " + '$2'))
$jTitle = ([regex]::Match($journalRaw, '<!--@title\s*(.*?)-->')).Groups[1].Value.Trim()
$jDesc = ([regex]::Match($journalRaw, '<!--@desc\s*(.*?)-->')).Groups[1].Value.Trim()
$jBody = [regex]::Replace($journalRaw, '<!--@\w+\s*.*?-->\r?\n?', '')
Write-Page 'journal' 'journal' $jTitle $jDesc $jBody

# --- sitemap -----------------------------------------------------------------
# Written for launch day. It has no effect while robots.txt carries Disallow.
$today = Get-Date -Format 'yyyy-MM-dd'
$urls = ($script:builtPages | Sort-Object -Unique | ForEach-Object {
  "  <url><loc>$_</loc><lastmod>$today</lastmod></url>"
}) -join "`n"
$sitemap = @"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
$urls
</urlset>
"@
Set-Content -Path (Join-Path $root 'sitemap.xml') -Value $sitemap -Encoding UTF8
Write-Host ''
Write-Host ("Sitemap: " + $script:builtPages.Count + " urls at " + $siteUrl)

Write-Host ''
Write-Host 'Done.'
