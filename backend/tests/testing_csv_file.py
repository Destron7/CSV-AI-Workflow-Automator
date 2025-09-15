# Let's create a more diverse dirty dataset for testing cleaning thoroughly

import pandas as pd
import numpy as np
import os


def generate_diverse_dirty_data(n_rows=5000):
    np.random.seed(123)

    # Sales column: mix of ints, floats, strings, negative, and None
    sales = np.random.choice(
        ["100", "200", "300.5", "four hundred", "-50", None, "1,000"], size=n_rows
    )

    # Price column: mix of currency symbols, floats, words, None
    price = np.random.choice(
        ["$10", "€20.75", "30", "40.5", "forty-five", None, "1,200.99"], size=n_rows
    )

    # Category: categorical with typos, spaces, case differences
    category = np.random.choice(
        ["A", "B", "C", "D", " a", "b ", "cC", "d"], size=n_rows
    )

    # Dates: multiple formats, invalid, missing
    dates = np.random.choice(
        [
            "2021-01-01",
            "2021/02/01",
            "March 3, 2021",
            "03-04-21",
            "not_a_date",
            None,
            "2021-12-31",
        ],
        size=n_rows,
    )

    # Duplicate: ints, floats, strings
    duplicate = np.random.choice([1, 2, 3, 3.0, "3", "three"], size=n_rows)

    df = pd.DataFrame(
        {
            " Sales ": sales,
            "Price($)": price,
            "Category ": category,
            "Date ": dates,
            "Duplicate": duplicate,
        }
    )

    # Add intentional duplicates (to test deduplication)
    df = pd.concat([df, df.sample(100, random_state=2)], ignore_index=True)
    return df


# Generate dataset
df_diverse_dirty = generate_diverse_dirty_data(5000)

# Create test_data directory if it doesn't exist
test_data_dir = "d:/Pro/CSV AI Workflow/backend/tests/test_data"
os.makedirs(test_data_dir, exist_ok=True)

# Save the dataset to a file
output_file = os.path.join(test_data_dir, "diverse_dirty_data.csv")
df_diverse_dirty.to_csv(output_file, index=True)

print(f"Dataset generated with shape: {df_diverse_dirty.shape}")
print(f"File saved to: {output_file}")
