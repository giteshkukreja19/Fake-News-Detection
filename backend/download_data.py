import pandas as pd
import logging
import urllib.request
import zipfile
import os
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

logging.basicConfig(level=logging.INFO, format="%(message)s")
log = logging.getLogger(__name__)

def main():
    log.info("Downloading LIAR dataset from UCSB...")
    try:
        urllib.request.urlretrieve('https://www.cs.ucsb.edu/~william/data/liar_dataset.zip', 'liar_dataset.zip')
        
        with zipfile.ZipFile('liar_dataset.zip', 'r') as zip_ref:
            zip_ref.extractall('liar_dataset')
            
        cols = ['id', 'label', 'statement', 'subject', 'speaker', 'job_title', 'state_info', 'party_affiliation', 'barely_true_counts', 'false_counts', 'half_true_counts', 'mostly_true_counts', 'pants_on_fire_counts', 'context']
        
        dfs = []
        for file in ['train.tsv', 'test.tsv', 'valid.tsv']:
            df = pd.read_csv(f'liar_dataset/{file}', sep='\t', header=None, names=cols)
            dfs.append(df)
            
        df = pd.concat(dfs, ignore_index=True)
        
        # Labels: half-true, mostly-true, true, false, barely-true, pants-fire
        def map_label(l):
            if l in ['half-true', 'mostly-true', 'true']: return 0 # REAL
            else: return 1 # FAKE
            
        df['label'] = df['label'].apply(map_label)
        df['text'] = df['statement']
        
        df = df[['text', 'label']]
        df.dropna(inplace=True)
        df.to_csv('dataset.csv', index=False)
        
        log.info(f"Successfully saved {len(df)} samples to dataset.csv")
    except Exception as e:
        log.error(f"Failed: {e}")

if __name__ == '__main__':
    main()
