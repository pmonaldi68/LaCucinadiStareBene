const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const SECTIONS = [
  { id: 1, page: 4, name: "Bevande e infusi del risveglio", quote: "Il primo calore della giornata deve arrivare da una tazza, non dal telefono.", chapter: "Capitolo 1 · Il risveglio", count: 8 },
  { id: 2, page: 13, name: "Colazioni dolci", quote: "Una colazione fatta in casa la senti fino a mezzogiorno.", chapter: "Capitolo 2 · La colazione", count: 18 },
  { id: 3, page: 32, name: "Colazioni salate", quote: "Un uovo e un pezzo di pane buono: non serve altro per cominciare bene.", chapter: "Capitolo 2 · La colazione", count: 14 },
  { id: 4, page: 47, name: "Spuntini di metà mattina", quote: "Lo spuntino si porta da casa, così sai cosa mangi.", chapter: "Capitolo 3 · La mattina", count: 10 },
  { id: 5, page: 58, name: "Primi piatti", quote: "La pasta si butta quando arrivano tutti a tavola, mai prima.", chapter: "Capitolo 4 · Il pranzo e il dopo pranzo", count: 26 },
  { id: 6, page: 85, name: "Zuppe e minestre", quote: "Una minestra calda mette d’accordo tutta la famiglia.", chapter: "Capitolo 4 e capitolo 10 · Il pranzo e il dopo pranzo · Le stagioni", count: 18 },
  { id: 7, page: 104, name: "Secondi di carne", quote: "La carne buona vuole tempo e fuoco basso.", chapter: "Capitolo 4 e capitolo 7 · Il pranzo e il dopo pranzo · La cena", count: 14 },
  { id: 8, page: 119, name: "Secondi di pesce", quote: "Il pesce povero è il più saporito: basta saperlo cucinare.", chapter: "Capitolo 4 e capitolo 7 · Il pranzo e il dopo pranzo · La cena", count: 14 },
  { id: 9, page: 134, name: "Uova e legumi", quote: "Con un pugno di legumi e due uova si sfama una tavolata.", chapter: "Capitolo 4 e capitolo 7 · Il pranzo e il dopo pranzo · La cena", count: 14 },
  { id: 10, page: 149, name: "Contorni e verdure", quote: "Le verdure di stagione non hanno bisogno di trucchi.", chapter: "Capitolo 4 e capitolo 7 · Il pranzo e il dopo pranzo · La cena", count: 20 },
  { id: 11, page: 170, name: "Merende del pomeriggio", quote: "La merenda è una pausa, non una corsa al dolce.", chapter: "Capitolo 5 · Il pomeriggio", count: 12 },
  { id: 12, page: 183, name: "Cene leggere", quote: "La sera si mangia leggero, così la notte riposa anche la pancia.", chapter: "Capitolo 7 · La cena", count: 14 },
  { id: 13, page: 198, name: "Tisane e bevande della sera", quote: "Una tazza calda è il modo più gentile per chiudere la giornata.", chapter: "Capitolo 8 e capitolo 9 · La sera · La notte", count: 8 },
  { id: 14, page: 207, name: "Basi di casa e recuperi", quote: "In una cucina di casa non si butta niente.", chapter: "Capitolo 4 e capitolo 10 · Il pranzo e il dopo pranzo · Le stagioni", count: 10 }
];

async function main() {
  const buf = fs.readFileSync('public/assets/aistudio/La_cucina_di_Stare_bene_come_una_volta_3e8d257b.pdf');
  const parser = new PDFParse(new Uint8Array(buf));
  await parser.load();
  const pdfResult = await parser.getText();
  const pages = pdfResult.pages;

  const sectionCoverPages = [4, 13, 32, 47, 58, 85, 104, 119, 134, 149, 170, 183, 198, 207];
  const recipeIndex = new Map(); // id -> { title, hasPhoto, page, sectionId }

  for (let sIdx = 0; sIdx < sectionCoverPages.length; sIdx++) {
    const sPage = sectionCoverPages[sIdx];
    const secInfo = SECTIONS[sIdx];
    const text = pages[sPage - 1].text;
    
    const regex = /(\d+)\s+([\s\S]*?)(●)?\s*pag\.\s*(\d+)\s*›/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const num = parseInt(match[1], 10);
      let title = match[2].replace(/\s+/g, ' ').trim();
      const hasPhoto = !!match[3];
      const page = parseInt(match[4], 10);
      recipeIndex.set(num, { num, title, hasPhoto, page, sectionId: secInfo.id });
    }
  }

  console.log(`Indexed ${recipeIndex.size} recipes from section covers.`);

  const allRecipes = [];

  for (let id = 1; id <= 200; id++) {
    const meta = recipeIndex.get(id);
    if (!meta) continue;

    const pageText = pages[meta.page - 1].text;
    const secInfo = SECTIONS.find(s => s.id === meta.sectionId);

    const procIdx = pageText.indexOf('P R O C E D I M E N T O');
    const ingrStartIdx = pageText.indexOf('I N G R E D I E N T I');
    const nonnaStartIdx = pageText.indexOf('Il consiglio della nonna');
    const footerStart = pageText.lastIndexOf('L A C U C I N A D I S T A R E B E N E');

    const header = pageText.slice(0, procIdx);
    const headerLines = header.split('\n').map(l => l.trim()).filter(Boolean);

    // Origin & Book reference
    let origin = '';
    let bookRef = '';
    for (const line of headerLines) {
      if (line.includes('·') && (line.includes('CITATA') || line.includes('RICETTA') || line.includes('SENZA') || line.includes('TRADIZIONE'))) {
        const parts = line.split('·').map(s => s.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim());
        origin = parts[0];
        bookRef = parts.slice(1).join(' · ');
        break;
      }
    }
    if (!origin) {
      for (const line of headerLines) {
        if (/^(T O S C A N A|S I C I L I A|P U G L I A|C A M P A N I A|L A Z I O|L O M B A R D I A|V E N E T O|T R E N T I N O|E M I L I A|U M B R I A|B A S I L I C A T A|L I G U R I A|F R I U L I|A B R U Z Z O|M A R C H E|R O M A|N O R D  I T A L I A|C E N T R O  I T A L I A|S U D  I T A L I A|C O S T E  I T A L I A N E|A P P E N N I N O|E R I T R E A)/.test(line)) {
          origin = line.replace(/\s+/g, ' ').trim();
          break;
        } else if (line.includes('RICETTA DI CASA') || line.includes('TRADIZIONE CONTADINA') || line.includes('CUCINA DI RECUPERO')) {
          origin = line.replace(/\s+/g, ' ').trim();
          break;
        }
      }
    }
    // Clean origin format
    const cleanOrigin = origin
      ? origin.replace(/([A-ZÀ-Ú])\s+(?=[A-ZÀ-Ú](\s|$))/g, '$1').replace(/\s+/g, ' ').trim()
      : 'Ricetta di casa';
    const cleanBookRef = bookRef
      ? bookRef.replace(/([A-ZÀ-Ú])\s+(?=[A-ZÀ-Ú](\s|$))/g, '$1').replace(/\s+/g, ' ').trim()
      : secInfo.chapter;

    // Preparation, Servings, Cook time
    const prepLineIdx = headerLines.findIndex(l => l.includes('P R E P A R A Z I O N E'));
    let prepTime = '15 min';
    let servings = '4 persone';
    let cookTime = 'nessuna';

    if (prepLineIdx !== -1) {
      prepTime = headerLines[prepLineIdx - 1] || '15 min';
      
      const p1 = headerLines[prepLineIdx - 2] || '';
      const p2 = headerLines[prepLineIdx - 3] || '';
      const p3 = headerLines[prepLineIdx - 4] || '';

      if (/canederli/i.test(p1) && /persone/i.test(p2)) {
        servings = '4 persone (8 canederli)';
      } else if (/^\d+$/.test(p2)) {
        servings = `${p2} ${p1.replace(/\s+/g, '').toLowerCase()}`;
      } else if (/^\d+/.test(p1)) {
        servings = p1.replace(/([A-ZÀ-Ú])\s+(?=[A-ZÀ-Ú](\s|$))/g, '$1').replace(/\s+/g, ' ').toLowerCase();
      } else if (/^\d+$/.test(p3)) {
        servings = `${p3} ${p2.replace(/\s+/g, '').toLowerCase()}`;
      } else {
        servings = p1.replace(/\s+/g, ' ').toLowerCase();
      }

      if (headerLines[prepLineIdx + 1]) {
        cookTime = headerLines[prepLineIdx + 1].replace(/\t.*$/, '').trim();
      }
    }

    // Clean description: lines above servings/prep that are actual prose
    let descLines = [];
    const servEndIdx = (prepLineIdx !== -1) ? prepLineIdx - 2 : headerLines.length - 1;
    for (let i = servEndIdx - 1; i >= 0; i--) {
      const l = headerLines[i];
      if (/B E V A N D E|C O L A Z I O N I|S P U N T I N I|P R I M I|Z U P P E|S E C O N D I|U O V A|C O N T O R N I|M E R E N D E|C E N E|T I S A N E|B A S I|N\s*\./.test(l)) break;
      if (l.includes('·') && (l.includes('CITATA') || l.includes('RICETTA') || l.includes('SENZA') || l.includes('TRADIZIONE'))) break;
      if (/^(T O S C A N A|S I C I L I A|P U G L I A|C A M P A N I A|L A Z I O|L O M B A R D I A|V E N E T O|T R E N T I N O|E M I L I A|U M B R I A|B A S I L I C A T A|L I G U R I A|F R I U L I|A B R U Z Z O|M A R C H E|R O M A|N O R D|C E N T R O|S U D|C O S T E|A P P E N N I N O|E R I T R E A)/.test(l)) break;
      if (/^N\s*\.\s*\d+/.test(l)) break;
      if (meta.title.toLowerCase().startsWith(l.toLowerCase()) && descLines.length === 0) continue;
      descLines.unshift(l);
      if (descLines.length >= 3) break;
    }
    const description = descLines.join(' ').replace(/\s+/g, ' ').trim();

    // Steps
    const procText = pageText.slice(procIdx + 'P R O C E D I M E N T O'.length, ingrStartIdx).trim();
    const stepLines = procText.split('\n').map(l => l.trim()).filter(Boolean);
    const steps = [];
    let curStep = '';
    for (const l of stepLines) {
      const m = l.match(/^(\d+)\s+(.*)/);
      if (m) {
        if (curStep) steps.push(curStep.replace(/\s+/g, ' ').trim());
        curStep = m[2];
      } else {
        if (curStep) curStep += ' ' + l;
        else curStep = l;
      }
    }
    if (curStep) steps.push(curStep.replace(/\s+/g, ' ').trim());

    // Ingredients
    const ingrText = pageText.slice(ingrStartIdx + 'I N G R E D I E N T I'.length, nonnaStartIdx).trim();
    const ingrLines = ingrText.split('\n').map(l => l.trim()).filter(Boolean);
    const ingredients = [];
    let curIngr = '';
    for (const l of ingrLines) {
      if (/^(\d+|[¼½¾⅓⅔]|q\.b\.|qualche|mezzo|mezza|un\s|una\s)/i.test(l)) {
        if (curIngr) ingredients.push(curIngr.replace(/\s+/g, ' ').trim());
        curIngr = l.replace(/\t/g, ' ').replace(/\s+/g, ' ');
      } else {
        if (curIngr) {
          curIngr += ' ' + l.replace(/\t/g, ' ').replace(/\s+/g, ' ');
        } else {
          curIngr = l.replace(/\t/g, ' ').replace(/\s+/g, ' ');
        }
      }
    }
    if (curIngr) ingredients.push(curIngr.replace(/\s+/g, ' ').trim());

    // Nonna tip
    let nonnaTip = pageText.slice(nonnaStartIdx + 'Il consiglio della nonna'.length, footerStart !== -1 ? footerStart : undefined).trim();
    nonnaTip = nonnaTip.replace(/\s+/g, ' ').trim();

    // Difficulty
    let difficulty = 1;
    if (meta.title.includes('Cacciucco') || meta.title.includes('Virtù teramane') || meta.title.includes('lievito madre') || meta.title.includes('Passata di pomodoro') || meta.title.includes('Pansoti') || meta.title.includes('Dado vegetale') || meta.title.includes('Giardiniera')) {
      difficulty = 3;
    } else if (steps.length >= 5 || prepTime.includes('25') || prepTime.includes('30') || prepTime.includes('40') || prepTime.includes('45') || cookTime.includes('40') || cookTime.includes('45') || cookTime.includes('50') || cookTime.includes('1 h') || cookTime.includes('2 h')) {
      difficulty = 2;
    }

    allRecipes.push({
      id,
      title: meta.title,
      sectionId: meta.sectionId,
      sectionName: secInfo.name,
      page: meta.page,
      hasPhoto: meta.hasPhoto,
      origin: cleanOrigin,
      bookRef: cleanBookRef,
      description,
      servings,
      prepTime,
      cookTime,
      difficulty,
      ingredients,
      steps,
      nonnaTip
    });
  }

  console.log(`Parsed all ${allRecipes.length} recipes!`);
  fs.writeFileSync('src/data/recipes.json', JSON.stringify(allRecipes, null, 2));
  fs.writeFileSync('src/data/sections.json', JSON.stringify(SECTIONS, null, 2));
  console.log('Successfully written src/data/recipes.json and src/data/sections.json');
}

main().catch(console.error);
