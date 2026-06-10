#!/usr/bin/env python3
"""Generate word data files for LexiQuest from the system dictionary.

Outputs:
  js/data/words.js   - DICT5 (valid 5-letter guesses), ANSWERS5 (curated common
                       answers), TREK words (3-7 letters) for grid validation
  js/data/petals.js  - pre-computed 7-letter petal puzzles with valid word lists
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DICT_PATH = "/usr/share/dict/words"

# Curated common five-letter answer words (kept only if present in system dict).
ANSWERS5 = """
about above abuse actor acute adapt admit adopt adult after again agent agree
ahead alarm album alert alike alive allow alone along alter amber amend angel
anger angle angry ankle apart apple apply arena argue arise armor aroma array
arrow aside asset audio audit avoid awake award aware badge badly baker basic
basis batch beach beard beast began begin being belly below bench berry birth
black blade blame blank blast blaze bleed blend bless blind block blood bloom
board boast bonus boost booth bound brain brake brand brave bread break breed
brick bride brief bring broad broke brown brush build bunch burst buyer cabin
cable candy cargo carry carve catch cause cease chain chair chalk charm chart
chase cheap check cheek cheer chess chest chief child chill choir chose chunk
churn cider cigar civic civil claim clash class clean clear clerk click cliff
climb cling clock close cloth cloud coach coast cocoa colon color comet comic
coral couch could count court cover crack craft crane crash crawl crazy cream
creek crime crisp cross crowd crown crude cruel crush curve cycle daily dairy
dance datum dealt death debut decay decor delay delta dense depth devil diary
dirty ditch dodge doing donor doubt dough dozen draft drain drama drank dream
dress dried drift drill drink drive drove dying eager eagle early earth eight
elbow elder elect elite empty enemy enjoy enter entry equal error essay event
every exact exist extra fable faint fairy faith false fancy fatal fault favor
feast fence ferry fever fiber field fifth fifty fight final first flame flash
fleet flesh float flock flood floor flour fluid flush focal focus foggy force
forge forth forty forum found frame fraud fresh front frost fruit fully funny
gauge ghost giant given glass globe glory glove going grace grade grain grand
grant grape grasp grass grave great greed green greet grief grill grind gross
group grove grown guard guess guest guide habit happy harsh haste hatch haunt
heart heavy hedge hello hence hobby honey honor horse hotel house human humor
hurry ideal image imply index inner input irony issue ivory jeans jelly jewel
joint jolly judge juice kneel knife knock known label labor large laser later
laugh layer learn lease least leave legal lemon level light limit linen liver
local lodge logic loose lover lower loyal lucky lunar lunch lyric magic major
maker mango maple march match maybe mayor meant medal media mercy merge merit
merry metal meter midst might minor minus mixed model moist money month moral
motor mount mouse mouth movie music naval nerve never newly night noble noise
north notch novel nurse occur ocean offer often olive onion onset orbit order
organ other ought ounce outer owner paint panel panic paper party pasta patch
pause peace pearl pedal penny phase phone photo piano piece pilot pinch pitch
pivot pixel place plain plane plant plate plaza pluck point polar porch pound
power press price pride prime print prior prize probe prone proof proud prove
pulse pupil purse queen query quest quick quiet quilt quite quote radar radio
raise rally ranch range rapid ratio reach react ready realm rebel refer reign
relax relay renew reply rider ridge rifle right rigid risky rival river roast
robin robot rocky rough round route royal rugby ruler rural saint salad sandy
sauce scale scarf scene scent scope score scout scrap screw seize sense serve
seven shade shaft shake shall shame shape share sharp sheep sheet shelf shell
shift shine shirt shock shore short shout shown sight silly since sixty skill
skirt slate sleep slice slide slope small smart smell smile smoke snack snake
solar solid solve sorry sound south space spare spark speak speed spell spend
spice spike spine spite split spoke spoon sport spray staff stage stair stake
stand stare start state steam steel steep steer stick stiff still stock stone
stood stool store storm story stove strap straw strip stuck study stuff style
sugar suite sunny super surge swear sweep sweet swift swing sword table taken
taste teach tempo tenth thank theme there thick thing think third those three
threw throw thumb tiger tight timer title toast today token tooth topic torch
total touch tough towel tower trace track trade trail train trait treat trend
trial tribe trick troop truck truly trunk trust truth tutor twice twist ultra
uncle under union unity until upper upset urban usage usual valid value vapor
verse video virus visit vital vivid vocal voice voter wagon waist waste watch
water weave wedge weigh weird whale wheat wheel where which while white whole
whose widow width witch woman world worry worse worth would wound woven wrist
write wrong wrote yacht yield young youth
""".split()

# Pangram seeds for petal puzzles (words with exactly 7 unique letters).
PANGRAM_SEEDS = """
blanket campers thimble crowned plastic harvest garment problem charity
gradient mountain holiday painted lawsuit kingdom whisper triangle dolphin
fortune crystal organic justice languid mistral pounced bravely chowder
glimpse stumble whacked jubilee verdict trumpet flowery champion sterling
"""

VOWELS = set("aeiou")


def load_dict():
    words = set()
    with open(DICT_PATH) as f:
        for line in f:
            w = line.strip()
            if re.fullmatch(r"[a-z]+", w):
                words.add(w)
    return words


def make_petal_puzzles(words):
    common = {w for w in words if 4 <= len(w) <= 9}
    puzzles = []
    seen_letterset = set()
    for seed in PANGRAM_SEEDS.split():
        letters = sorted(set(seed))
        if len(letters) != 7 or seed not in words:
            continue
        key = "".join(letters)
        if key in seen_letterset:
            continue
        lset = set(letters)
        # pick the most productive center letter that keeps 18-70 words
        best = None
        for center in letters:
            valid = sorted(
                w for w in common if set(w) <= lset and center in w
            )
            pangrams = [w for w in valid if set(w) == lset]
            if 18 <= len(valid) <= 70 and pangrams:
                if best is None or len(valid) > len(best[1]):
                    best = (center, valid, pangrams)
        if best:
            center, valid, pangrams = best
            outer = [c for c in letters if c != center]
            puzzles.append(
                {
                    "center": center,
                    "outer": outer,
                    "words": valid,
                    "pangrams": pangrams,
                }
            )
            seen_letterset.add(key)
    return puzzles


def main():
    words = load_dict()

    dict5 = sorted(w for w in words if len(w) == 5)
    answers = sorted(set(w for w in ANSWERS5 if w in words or len(w) == 5))
    # make sure every answer is also a valid guess
    dict5 = sorted(set(dict5) | set(answers))

    trek = sorted(w for w in words if 3 <= len(w) <= 7)

    os.makedirs(os.path.join(ROOT, "js", "data"), exist_ok=True)

    with open(os.path.join(ROOT, "js", "data", "words.js"), "w") as f:
        f.write("// Generated by tools/generate_data.py - do not edit.\n")
        f.write("window.LQ_DATA = window.LQ_DATA || {};\n")
        f.write("LQ_DATA.DICT5 = " + json.dumps(" ".join(dict5)) + ".split(' ');\n")
        f.write("LQ_DATA.ANSWERS5 = " + json.dumps(" ".join(answers)) + ".split(' ');\n")
        f.write("LQ_DATA.TREK = " + json.dumps(" ".join(trek)) + ".split(' ');\n")

    puzzles = make_petal_puzzles(words)
    with open(os.path.join(ROOT, "js", "data", "petals.js"), "w") as f:
        f.write("// Generated by tools/generate_data.py - do not edit.\n")
        f.write("window.LQ_DATA = window.LQ_DATA || {};\n")
        f.write("LQ_DATA.PETALS = " + json.dumps(puzzles, separators=(",", ":")) + ";\n")

    print(f"dict5={len(dict5)} answers={len(answers)} trek={len(trek)} petals={len(puzzles)}")


if __name__ == "__main__":
    main()
