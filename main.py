import eel
import pandas as pd
import os

eel.init("web")

DATA_PATH = os.path.join("web", "osn.csv")


def ambil_data_osn():
    """Membaca dataset dan menghasilkan data untuk dashboard."""
    try:
        df = pd.read_csv(DATA_PATH)
    except FileNotFoundError:
        return {
            "success": False,
            "message": f"File dataset tidak ditemukan: {DATA_PATH}",
            "data": [],
            "statistik": {},
            "analisis": {}
        }

    # Rapikan nama kolom dan nilai kosong tanpa mengubah file sumber.
    df.columns = [str(col).strip() for col in df.columns]
    df = df.fillna("")

    records = df.to_dict(orient="records")
    columns = list(df.columns)

    def find_col(candidates):
        lowered = {str(c).strip().lower(): c for c in columns}
        for candidate in candidates:
            if candidate.lower() in lowered:
                return lowered[candidate.lower()]
        for col in columns:
            low = str(col).lower()
            if any(candidate.lower() in low for candidate in candidates):
                return col
        return None

    name_col = find_col(["nama", "name", "peserta"])
    field_col = find_col(["bidang", "cabang", "field", "kategori"])
    year_col = find_col(["tahun", "year"])
    medal_col = find_col(["medali", "medal", "penghargaan"])
    province_col = find_col(["provinsi", "province"])
    gender_col = find_col(["jenis kelamin", "gender", "kelamin"])

    def counts(col):
        if not col:
            return {}
        values = df[col].astype(str).str.strip()
        values = values[values != ""]
        return {str(k): int(v) for k, v in values.value_counts().items()}

    medali_counts = counts(medal_col)
    bidang_counts = counts(field_col)
    tahun_counts = counts(year_col)
    provinsi_counts = counts(province_col)
    gender_counts = counts(gender_col)

    total = len(df)
    emas = sum(v for k, v in medali_counts.items() if "emas" in k.lower() or "gold" in k.lower())
    perak = sum(v for k, v in medali_counts.items() if "perak" in k.lower() or "silver" in k.lower())
    perunggu = sum(v for k, v in medali_counts.items() if "perunggu" in k.lower() or "bronze" in k.lower())

    return {
        "success": True,
        "message": "Dataset berhasil dimuat.",
        "data": records,
        "columns": columns,
        "statistik": {
            "total_peserta": total,
            "total_bidang": len(bidang_counts),
            "total_tahun": len(tahun_counts),
            "total_provinsi": len(provinsi_counts),
            "emas": emas,
            "perak": perak,
            "perunggu": perunggu,
            "medali": medali_counts,
            "bidang": bidang_counts,
            "tahun": tahun_counts,
            "provinsi": provinsi_counts,
            "gender": gender_counts,
        },
        "analisis": {
            "kolom_nama": name_col,
            "kolom_bidang": field_col,
            "kolom_tahun": year_col,
            "kolom_medali": medal_col,
            "kolom_provinsi": province_col,
            "kolom_gender": gender_col,
        }
    }


@eel.expose
def ambil_data():
    """Dipanggil frontend untuk memuat dataset lengkap."""
    return ambil_data_osn()


eel.start("index.html", size=(1360, 860))
