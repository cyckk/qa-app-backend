import express from 'express';
import auth from './middlewares/auth';
import jwt from 'jsonwebtoken';

import _ from 'lodash';

import { User } from '../models/user';
import { Report, Grade } from '../models/report';

const router = express.Router();

// Add new Report
router.post('/addReport', auth, async (req, res) => {
  console.log('addReport route');
  const reportDetails = req.body.reportDetails;
  console.log('report details ', reportDetails);
  try {
    const newGrade = calculateGrades(reportDetails.questions);

    let reportResult = Math.round((newGrade.score / newGrade.totalMarks) * 100);
    reportDetails.fatalParams.forEach(ft => {
      if (ft.ans == 11) {
        reportResult = 'F';
      }
    });
    const report = await Report.create({
      ...reportDetails,
      result: reportResult,
    });

    const grade = await Grade.create({ _id: report._id, ...newGrade });

    if (report && grade) {
      console.log('no report or grade ', report, grade);
      res.status(200).json({ err: 0, msg: 'Report saved ', report });
    } else {
      console.log('report and grade ', report, grade);
      res.json({ err: 1, msg: 'Some exception' });
    }
  } catch (error) {
    console.log('error in addReport ', error);
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
    const grades = await Grade.findById(reportId);

    res.status(200).json({ report, grades });
  } catch (error) {
    console.log('error while fetching report ', errror);
    res.json({ err: 1, msg: errro.message });
  }
});

// Edit Indivisual Report
router.post('/editReport/:ID', async (req, res) => {
  try {
    const reportID = req.params.ID;
    let reportDetails = req.body.reportDetails;
    const newGrade = calculateGrades(reportDetails.questions);
    const grade = await Grade.findByIdAndUpdate(reportID, {
      $set: { newGrade },
    });
    let reportResult = Math.round((newGrade.score / newGrade.totalMarks) * 100);
    reportDetails.fatalParams.forEach(ft => {
      if (ft.ans == 11) {
        reportResult = 'F';
      }
    });

    reportDetails = {
      ...reportDetails,
      result: reportResult,
    };
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
router.get('/allReports/:month', auth, async (req, res) => {
  const token = req.token;
  let currentUser = await jwt.decode(token);
  const month = req.params.month;

  const yesterMonth = new Date();
  yesterMonth.setMonth(month - 1);
  yesterMonth.setDate(1);
  const nextMonth = new Date();
  nextMonth.setMonth(month + 1);
  nextMonth.setDate(1);

  let allReports = [];

  currentUser = await User.findOne({ email: currentUser.email });

  console.log('currentUser ', currentUser.permissions);

  if (
    currentUser.permissions.includes('viewAll') ||
    currentUser.permissions.includes('admin')
  ) {
    console.log('viewAll or admin permission');
    try {
      const reports = await Report.find({
        $and: [
          { createdAt: { $gt: yesterMonth } },
          // { createdAt: { $lt: nextMonth } },
        ],
      });
      allReports = reports;
    } catch (error) {
      res.json({ err: 1, msg: 'SomeThing Went Wrong', error: error.message });
    }
    res.json({ err: 0, reports: allReports });
  } else {
    if (currentUser.permissions.includes('viewMy')) {
      try {
        const reports = await Report.find({
          $and: [
            { createdAt: { $gt: yesterMonth } },
            { createdAt: { $lt: nextMonth } },
            {
              $or: [
                { counselor: currentUser.name },
                { auditor: currentUser.name },
              ],
            },
          ],
        });
        allReports = _.union(allReports, reports);
      } catch (error) {
        res.json({ err: 1, msg: 'SomeThing Went Wrong', error: error.message });
      }
      // res.json({ err: 0, reports: allReports });
    }

    if (currentUser.permissions.includes('viewTl')) {
      try {
        const reports = await Report.find({
          $and: [
            { createdAt: { $gt: yesterMonth } },
            { createdAt: { $lt: nextMonth } },
            { teamLead: currentUser.name },
          ],
        });
        allReports = _.union(allReports, reports);
      } catch (error) {
        res.json({ err: 1, msg: 'SomeThing Went Wrong', error: error.message });
      }
      // res.json({ err: 0, reports: allReports });
    }

    if (currentUser.permissions.includes('viewSm')) {
      try {
        const reports = await Report.find({
          $and: [
            { createdAt: { $gt: yesterMonth } },
            { createdAt: { $lt: nextMonth } },
            { seniorManager: currentUser.name },
          ],
        });
        allReports = _.union(allReports, reports);
      } catch (error) {
        res.json({ err: 1, msg: 'SomeThing Went Wrong', error: error.message });
      }
      // res.json({ err: 0, reports: allReports });
    }

    res.json({ err: 0, reports: allReports });
  }
});

const calculateGrades = questions => {
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
  questions.forEach(question => {
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
