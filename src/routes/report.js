import express from 'express';
import auth from './middlewares/auth';
import jwt from 'jsonwebtoken';
import { Report, Grade } from '../models/report';

const router = express.Router();

// Add new Report
router.post('/addReport', auth, async (req, res) => {
  const reportDetails = req.body.reportDetails;
  try {
    const newGrade = calculateGrades(reportDetails.questions);

    const report = await Report.create(reportDetails);
    const grade = await Grade.create({ _id: report._id, ...newGrade });

    if (report && grade) {
      res.status(200).json({ err: 0, msg: 'Report saved ', report });
    } else {
      res.json({ err: 1, msg: 'Some exception' });
    }
  } catch (error) {
    if (error.name == 'MongoError') {
      res.json({ err: 1, msg: 'email already found' });
    } else if (error.name == 'JsonWebTokenError') {
      res.json({ err: 1, msg: 'Your Token is not Verified' });
    } else {
      console.log('error ', error);
      res.json({ err: 1, msg: 'something Wrong', errmsg: error });
    }
  }
});

// Get Indivisual Report
router.get('/getReport/:reportId', auth, async (req, res) => {
  const reportId = req.params.reportId;
  try {
    const report = await Report.findById(reportId);
    res.status(200).send(report);
  } catch (error) {
    console.log('error while fetching report ', errror);
    res.json({ err: 1, msg: errro.message });
  }
});

// Edit Indivisual Report
router.put('/edit/:ID', async (req, res) => {
  try {
    const reportID = req.params.ID;
    const reportDetails = req.body.reportDetails;
    const newGrade = calculateGrades(reportDetails.questions);
    const grade = await Grade.findByIdAndUpdate(reportID, {
      $set: { newGrade },
    });
    const update = await Report.findByIdAndUpdate(
      reportID,
      {
        $set: reportDetails,
      },
      { new: true }
    );
    res.json({ err: 0, report: update, grade });
  } catch (error) {
    res.status(404).json({ err: 1, msg: error.message });
  }
});

// VIew All Report
router.get('/allReport', auth, async (req, res) => {
  // const Token = req.token;
  // const currentUser = await jwt.decode(Token);
  try {
    const report = await Report.find();
    res.json({ err: 0, report });
  } catch (error) {
    res.json({ err: 1, msg: 'SomeThing Went Wrong', error: error.message });
  }
});

const calculateGrades = (questions) => {
  let totalMarks = 0;
  let totalMarksCS = 0;
  let totalMarksP = 0;
  let totalMarksPK = 0;
  let totalMarksPR = 0;

  let scoreCS = 0;
  let scoreP = 0;
  let scorePK = 0;
  let scorePR = 0;
  let score = 0;
  questions.forEach((question) => {
    //   if (question.category.includes('CS')) {
    //     scoreCS += question.ans == 100 ? 0 : parseInt(question.ans);
    //     totalMarksCS += question.ans == 100 ? 0 : parseInt(question.marks);
    //   } else if (question.category.includes('P')) {
    //     scoreP += question.ans == 100 ? 0 : parseInt(question.ans);
    //     totalMarksP += question.ans == 100 ? 0 : parseInt(question.marks);
    //   } else if (question.category.includes('PK')) {
    //     scorePK += question.ans == 100 ? 0 : parseInt(question.ans);
    //     totalMarksPK += question.ans == 100 ? 0 : parseInt(question.marks);
    //   } else if (question.category.includes('PR')) {
    //     scorePR += question.ans == 100 ? 0 : parseInt(question.ans);
    //     totalMarksPR += question.ans == 100 ? 0 : parseInt(question.marks);
    //   } else {
    //     score += question.ans == 100 ? 0 : parseInt(question.ans);
    //     totalMarks += question.ans == 100 ? 0 : parseInt(question.marks);
    //   }

    scoreCS +=
      question.category.includes('CS') && question.ans != 100
        ? parseInt(question.ans)
        : 0;
    totalMarksCS +=
      question.category.includes('CS') && question.ans != 100
        ? parseInt(question.marks)
        : 0;

    scoreP +=
      question.category.includes('P') && question.ans != 100
        ? parseInt(question.ans)
        : 0;
    totalMarksP +=
      question.category.includes('P') && question.ans != 100
        ? parseInt(question.marks)
        : 0;

    scorePK +=
      question.category.includes('PK') && question.ans != 100
        ? parseInt(question.ans)
        : 0;
    totalMarksPK +=
      question.category.includes('PK') && question.ans != 100
        ? parseInt(question.marks)
        : 0;

    scorePR +=
      question.category.includes('PR') && question.ans != 100
        ? parseInt(question.ans)
        : 0;
    totalMarksPR +=
      question.category.includes('PR') && question.ans != 100
        ? parseInt(question.marks)
        : 0;

    score += question.ans != 100 ? parseInt(question.ans) : 0;
    console.log('score ', score);
    totalMarks += question.ans != 100 ? parseInt(question.marks) : 0;
    console.log('totalMarks ', totalMarks);
  });
  return {
    score: score,
    totalMarks: totalMarks,
    scoreCS,
    totalMarksCS,
    scoreP,
    totalMarksP,
    scorePK,
    totalMarksPK,
    scorePR,
    totalMarksPR,
  };
};

export default router;
