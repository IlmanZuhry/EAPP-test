import eel
import pandas as pd
import os

eel.init('web')
@eel.expose
def ambil_data_osn():
    try : 
        base_dir = os.path.dirname(os.path.abspath(__file__))
        file_csv = os.path.join(base_dir, 'web', 'osn.csv')
        if not os.path.exists(file_csv):
            return {
                "success": False,
                "message": "File CSV tidak ditemukan."
            }

        df = pd.read_csv(file_csv)
        df.columns = [
            kolom.strip() for kolom in df.columns
        ]
        print("Kolom CSV:")
        print(df.columns.tolist())

        jumlah_peserta = len(df)
        jumlah_laki = len(df[df["Gender"] == "L"])
        jumlah_perempuan = len(df[df["Gender"] == "P"])

        jumlah_emas =  len(df[df["Medali"] == "Emas"])
        jumlah_perak = len(df[df["Medali"] == "Perak"])
        jumlah_perunggu = len(df[df["Medali"] == "Perunggu"])

        bidang = (df["Bidang"].value_counts().head(10))
        tahun = (df["Tahun"].value_counts().sort_index())

        data_peserta = df[
            [
                "No",
                "Nama Peserta",
                "Gender",
                "Sekolah",
                "Provinsi",
                "Bidang",
                "Medali",
                "Tahun"
            ]
        ].head(20)

        data_peserta = (data_peserta.fillna("").to_dict(orient="records"))

        data_bidang = {
            "labels": bidang.index.tolist(),
            "values": bidang.values.tolist()
        }

        data_tahun ={
            "labels":[
                str(t)
                for t in tahun.index.tolist()
            ],
            "values": tahun.values.tolist()
        }

        return{
            "success": True,
            "jumlah" : jumlah_peserta,
            "laki" : jumlah_laki,
            "perempuan" : jumlah_perempuan,
            "emas" : jumlah_emas,
            "perak" : jumlah_perak,
            "perunggu" : jumlah_perunggu,
            "data" : data_peserta,
            "bidang" : data_bidang,
            "tahun" : data_tahun
        }

    except Exception as e:
        print("ERROR :", e)
        return{
            "success": False,
            "message": str(e)
        }

eel.start('index.html', size=(1100, 750))
