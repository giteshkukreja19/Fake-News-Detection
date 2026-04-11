"""
backend/ml/train.py  (FIX 2 — proper training)
================================================
Creates model.pkl which the backend uses for offline prediction.
Run this ONCE before starting the backend server.

  cd backend
  python ml/train.py                     # uses 60 built-in samples
  python ml/train.py --data dataset.csv  # use your own CSV (text,label cols)

Recommended datasets for 90%+ accuracy:
  LIAR         https://paperswithcode.com/dataset/liar          (12k rows)
  ISOT         https://uvic.ca/engineering/ece/isot/datasets/   (44k rows)
  FakeNewsNet  https://github.com/KaiDMML/FakeNewsNet           (20k rows)
"""
import argparse, pickle, re, logging
from pathlib import Path

import pandas as pd
from sklearn.pipeline              import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model          import LogisticRegression
from sklearn.model_selection       import train_test_split, cross_val_score
from sklearn.metrics               import classification_report, accuracy_score

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(message)s")
log = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent / "model.pkl"

# ── 60-sample balanced training set (good for demo; use a real dataset for prod)
SAMPLES = [
    # 0 = REAL
    ("Scientists confirm COVID-19 vaccine 95% effective in peer-reviewed study", 0),
    ("Government releases official climate change report with new statistical data", 0),
    ("Stock market hits record high amid strong quarterly economic indicators", 0),
    ("New study finds Mediterranean diet reduces heart disease risk by 30%", 0),
    ("NASA confirms water ice discovered near lunar south pole in new mission", 0),
    ("Election results certified by state officials across all 50 states", 0),
    ("Researchers find new antibiotic effective against drug-resistant bacteria", 0),
    ("Supreme Court issues landmark ruling on major constitutional case", 0),
    ("Tech company reports quarterly earnings beating analyst expectations by 12%", 0),
    ("University publishes breakthrough Alzheimer's treatment research in Nature journal", 0),
    ("WHO announces global measles vaccination campaign across 15 countries", 0),
    ("Federal Reserve raises interest rates by 25 basis points, officials say", 0),
    ("According to experts, global temperatures rose 1.1°C above pre-industrial levels", 0),
    ("Parliament passes new education funding bill with bipartisan support", 0),
    ("Reuters: Central bank reports GDP growth of 3.2% in third quarter", 0),
    ("Scientists publish findings on new exoplanet discovered by James Webb telescope", 0),
    ("Local government announces infrastructure investment of $2 billion for roads", 0),
    ("Study published in Lancet confirms new diabetes treatment is effective", 0),
    ("Associated Press: President signs executive order on cybersecurity standards", 0),
    ("FDA approves new cancer immunotherapy drug after successful clinical trials", 0),
    ("UN report warns of accelerating biodiversity loss in tropical rainforests", 0),
    ("IMF upgrades global economic growth forecast to 3.5% for current year", 0),
    ("National weather service issues hurricane warning for coastal regions", 0),
    ("BBC: Prime minister announces new economic reform package for small businesses", 0),
    ("Apple reports record iPhone sales in emerging markets, earnings beat estimates", 0),
    ("Johns Hopkins study finds remote work increases productivity by 13 percent", 0),
    ("Senate committee approves infrastructure bill worth 550 billion dollars", 0),
    ("WHO says new variant is less severe based on early hospitalization data", 0),
    ("Scientists confirm ocean temperatures reached record highs for third year", 0),
    ("Central bank holds interest rates steady amid declining inflation figures", 0),
    # 1 = FAKE
    ("They don't want you to know the shocking truth about vaccines", 1),
    ("BREAKING: Secret government plot to control population exposed by whistleblower", 1),
    ("Miracle cure doctors are hiding from you to protect big pharma profits", 1),
    ("Deep state conspiracy to control the population finally uncovered", 1),
    ("100% proven cancer cure being suppressed by pharmaceutical companies", 1),
    ("Chemtrails are poison the government is secretly spraying on citizens", 1),
    ("Celebrities are all crisis actors in this shocking expose of the elite", 1),
    ("New world order plans revealed in top secret leaked document", 1),
    ("Shocking truth about 5G towers and government mind control exposed", 1),
    ("False flag operation fully exposed by brave patriots who risked everything", 1),
    ("Doctors hate this one weird trick to cure diabetes permanently overnight", 1),
    ("URGENT: Share before they delete this post — they are hiding the truth", 1),
    ("Bill Gates microchip hidden inside COVID vaccine exposed by insider source", 1),
    ("Insider reveals shocking truth about moon landing being a complete hoax", 1),
    ("What mainstream media refuses to tell you about the plandemic", 1),
    ("Government is hiding the cure for cancer to keep big pharma profits high", 1),
    ("Illuminati controls world governments — leaked documents prove everything", 1),
    ("Vaccine causes autism — study that big pharma buried for 20 years revealed", 1),
    ("Satanic elite running child sacrifice rings finally exposed by brave reporter", 1),
    ("Nobody is talking about how 5G is killing birds and causing health problems", 1),
    ("Deep state operatives were behind the false flag shooting to take your guns", 1),
    ("They don't want you to know ivermectin cures COVID instantly — share this", 1),
    ("Adrenochrome harvesting by Hollywood celebrities confirmed by insider source", 1),
    ("Flat earth confirmed by pilot who refused to fly the impossible globe routes", 1),
    ("Pizzagate is real — new evidence emerges proving the scandal was covered up", 1),
    ("Bleach cures coronavirus — government suppressing this amazing cheap treatment", 1),
    ("New world order vaccine passport is part of satanic plan to track all humans", 1),
    ("Shocking truth they are hiding: miracle herb cures cancer in 3 days naturally", 1),
    ("George Soros controls all major elections — leaked Soros memo proves it all", 1),
    ("CIA invented COVID-19 as bioweapon — whistleblower risks life to reveal all", 1),
]

# ── Preprocessor ─────────────────────────────────────────────────────────────
_STOP = {
    "the","a","an","and","or","but","in","on","at","to","for","of","with",
    "by","from","is","are","was","were","be","been","have","has","had",
    "do","does","did","will","would","could","should","may","might",
    "this","that","these","those","it","its","i","we","you","he","she",
    "they","their","our","my","his","her",
}

def preprocess(text: str) -> str:
    text = re.sub(r"http\S+|www\S+", " ", text.lower())
    text = re.sub(r"[^a-z\s]", " ", text)
    return " ".join(w for w in text.split() if w not in _STOP and len(w) > 2)

# ── Train ─────────────────────────────────────────────────────────────────────
def train(data_path: str = None):
    if data_path:
        log.info("Loading data from %s", data_path)
        df = pd.read_csv(data_path)
        assert "text" in df.columns and "label" in df.columns, \
            "CSV must have 'text' (str) and 'label' (0=REAL, 1=FAKE) columns"
    else:
        log.info("Using built-in 60-sample training data")
        df = pd.DataFrame(SAMPLES, columns=["text", "label"])

    df["text"] = df["text"].astype(str).apply(preprocess)
    X, y = df["text"], df["label"]

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=50_000,
            sublinear_tf=True,
            min_df=1,
        )),
        ("clf", LogisticRegression(
            C=1.0, max_iter=1000,
            class_weight="balanced",
            solver="lbfgs",
        )),
    ])

    pipeline.fit(X_tr, y_tr)
    preds = pipeline.predict(X_te)

    log.info("\n%s", classification_report(y_te, preds, target_names=["REAL", "FAKE"]))
    log.info("Test accuracy: %.1f%%", accuracy_score(y_te, preds) * 100)

    n_cv = min(5, len(df) // 6)
    if n_cv >= 2:
        cv = cross_val_score(pipeline, X, y, cv=n_cv)
        log.info("Cross-val accuracy: %.1f%% ± %.1f%%", cv.mean()*100, cv.std()*100)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(pipeline, f)

    log.info("✅  model.pkl saved → %s", MODEL_PATH)
    log.info("")
    log.info("NOTE: This model uses only 60 training samples.")
    log.info("For 90%%+ accuracy, train with a real dataset:")
    log.info("  python ml/train.py --data your_dataset.csv")
    log.info("Datasets: LIAR (12k), ISOT (44k), FakeNewsNet (20k)")
    return pipeline

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Fake News Detection model")
    parser.add_argument("--data", default=None, help="Path to CSV (text, label columns)")
    train(parser.parse_args().data)
