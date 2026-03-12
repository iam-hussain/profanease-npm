import ar from './ar.js';
import cs from './cs.js';
import da from './da.js';
import de from './de.js';
import en from './en.js';
import eo from './eo.js';
import es from './es.js';
import fa from './fa.js';
import fi from './fi.js';
import fr from './fr.js';
import hi from './hi.js';
import hu from './hu.js';
import it from './it.js';
import ja from './ja.js';
import ko from './ko.js';
import nl from './nl.js';
import no from './no.js';
import pl from './pl.js';
import pt from './pt.js';
import ru from './ru.js';
import sv from './sv.js';
import th from './th.js';
import tlh from './tlh.js';
import tr from './tr.js';
import zh from './zh.js';

const all: string[] = [
  ...ar, ...cs, ...da, ...de, ...en, ...eo, ...es, ...fa, ...fi, ...fr,
  ...hi, ...hu, ...it, ...ja, ...ko, ...nl, ...no, ...pl, ...pt, ...ru,
  ...sv, ...th, ...tlh, ...tr, ...zh,
];

export default all;

export const byLanguage: Record<string, string[]> = {
  ar, cs, da, de, en, eo, es, fa, fi, fr,
  hi, hu, it, ja, ko, nl, no, pl, pt, ru,
  sv, th, tlh, tr, zh,
};
