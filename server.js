require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;

const ADMIN_USERNAME =
  process.env.ADMIN_USERNAME || "maserwin";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "ganti_password";

const REPORT_FILE = path.join(
  __dirname,
  "database",
  "reports.json"
);

const sessions = new Map();

app.use(express.json());

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);


/* BUAT DATABASE JIKA BELUM ADA */

const databaseFolder = path.join(
  __dirname,
  "database"
);

if (!fs.existsSync(databaseFolder)) {

  fs.mkdirSync(
    databaseFolder,
    {
      recursive: true
    }
  );

}

if (!fs.existsSync(REPORT_FILE)) {

  fs.writeFileSync(
    REPORT_FILE,
    "[]",
    "utf8"
  );

}


/* BACA LAPORAN */

function getReports() {

  try {

    const data =
      fs.readFileSync(
        REPORT_FILE,
        "utf8"
      );

    return JSON.parse(data);

  }

  catch (error) {

    return [];

  }

}


/* SIMPAN LAPORAN */

function saveReports(reports) {

  fs.writeFileSync(

    REPORT_FILE,

    JSON.stringify(
      reports,
      null,
      2
    ),

    "utf8"

  );

}


/* CEK LOGIN ADMIN */

function getAdminSession(req) {

  const token =
    req.headers.authorization
      ?.replace(
        "Bearer ",
        ""
      );

  if (!token) {

    return false;

  }

  return sessions.has(token);

}


/* LOGIN ADMIN */

app.post(
  "/api/admin/login",

  (req, res) => {

    const {
      username,
      password
    } = req.body;


    if (

      username !== ADMIN_USERNAME ||

      password !== ADMIN_PASSWORD

    ) {

      return res.status(401).json({

        success: false,

        message:
          "Username atau password salah"

      });

    }


    const token =

      crypto.randomBytes(
        32
      ).toString(
        "hex"
      );


    sessions.set(

      token,

      {

        username,

        loginAt:
          Date.now()

      }

    );


    res.json({

      success: true,

      token

    });

  }

);


/* LOGOUT */

app.post(
  "/api/admin/logout",

  (req, res) => {

    const token =
      req.headers.authorization
        ?.replace(
          "Bearer ",
          ""
        );


    if (token) {

      sessions.delete(
        token
      );

    }


    res.json({

      success: true

    });

  }

);


/* KIRIM LAPORAN DARI USER */

app.post(
  "/api/reports",

  (req, res) => {

    const {

      type,

      title,

      description

    } = req.body;


    const validTypes = [

      "bug",

      "feature"

    ];


    if (

      !validTypes.includes(
        type
      )

    ) {

      return res.status(400).json({

        success: false,

        message:
          "Jenis laporan tidak valid"

      });

    }


    if (

      !title ||

      !description

    ) {

      return res.status(400).json({

        success: false,

        message:
          "Judul dan laporan wajib diisi"

      });

    }


    if (

      title.length > 100 ||

      description.length > 2000

    ) {

      return res.status(400).json({

        success: false,

        message:
          "Laporan terlalu panjang"

      });

    }


    const reports =
      getReports();


    const report = {

      id:
        crypto.randomUUID(),

      number:
        reports.length + 1,

      type,

      title:
        title.trim(),

      description:
        description.trim(),

      status:
        "open",

      createdAt:
        new Date()
          .toISOString()

    };


    reports.unshift(
      report
    );


    saveReports(
      reports
    );


    res.json({

      success: true,

      message:
        "Laporan berhasil dikirim"

    });

  }

);


/* AMBIL LAPORAN ADMIN */

app.get(
  "/api/admin/reports",

  (req, res) => {

    if (

      !getAdminSession(
        req
      )

    ) {

      return res.status(401).json({

        success: false,

        message:
          "Silakan login admin"

      });

    }


    const reports =
      getReports();


    res.json({

      success: true,

      reports

    });

  }

);


/* UBAH STATUS */

app.patch(
  "/api/admin/reports/:id",

  (req, res) => {

    if (

      !getAdminSession(
        req
      )

    ) {

      return res.status(401).json({

        success: false

      });

    }


    const {
      status
    } = req.body;


    if (

      ![
        "open",
        "done"
      ].includes(
        status
      )

    ) {

      return res.status(400).json({

        success: false

      });

    }


    const reports =
      getReports();


    const report =
      reports.find(

        item =>

          item.id ===
          req.params.id

      );


    if (!report) {

      return res.status(404).json({

        success: false,

        message:
          "Laporan tidak ditemukan"

      });

    }


    report.status =
      status;


    saveReports(
      reports
    );


    res.json({

      success: true

    });

  }

);


/* HAPUS LAPORAN */

app.delete(
  "/api/admin/reports/:id",

  (req, res) => {

    if (

      !getAdminSession(
        req
      )

    ) {

      return res.status(401).json({

        success: false

      });

    }


    const reports =
      getReports();


    const newReports =

      reports.filter(

        item =>

          item.id !==
          req.params.id

      );


    saveReports(
      newReports
    );


    res.json({

      success: true

    });

  }

);


/* JALANKAN */

app.listen(

  PORT,

  () => {

    console.log(

      `PAYMENT MASERWIN aktif di http://localhost:${PORT}`

    );

  }

);
