import express from 'express';
import auth from './middlewares/auth';
import jwt from 'jsonwebtoken';

import _ from 'lodash';

import { User } from '../models/user';
import { Report, Grade } from '../models/report';

import calculateGrades from './utils/calculateGrades';
import calcDateRange from './utils/calcDateRange';

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
router.get('/getReport/:reportId', async (req, res) => {
  const reportId = req.params.reportId;
  try {
    const report = await Report.findById(reportId);
    const grades = await Grade.findById(reportId);

    res.status(200).json({ report, grades });
  } catch (error) {
    console.log('error while fetching report ', error);
    res.json({ err: 1, msg: error.message });
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

// VIew All Report by month
router.get('/allReports/:month', auth, async (req, res) => {
  const token = req.token;
  let currentUser = await jwt.decode(token);
  const month = parseInt(req.params.month);

  let [yesterMonth, nextMonth] = calcDateRange(month);

  console.log('month ', month);

  console.log('yeasterMonth ', yesterMonth);
  console.log('nextMonth', new Date(nextMonth));

  let allReports = [];

  currentUser = await User.findOne({ email: currentUser.email });

  console.log('currentUser ', currentUser.permissions);

  if (
    currentUser.permissions.includes('viewAll') ||
    currentUser.permissions.includes('admin')
  ) {
    console.log('viewAll or admin permission');
    try {
      const reports = await Report.find({});

      let chu = reports.filter(report => {
        if (report.createdAt >= yesterMonth && report.createdAt <= nextMonth) {
          console.log('report ', new Date(report.createdAt));
          return report;
        }
      });

      allReports = chu;
    } catch (error) {
      return res.json({
        err: 1,
        msg: 'SomeThing Went Wrong',
        error: error.message,
      });
    }
    console.log('allReports ', allReports);
    res.json({ err: 0, reports: allReports });
  } else {
    if (currentUser.permissions.includes('viewMy')) {
      try {
        const reports = await Report.find({
          $or: [
            { counselor: currentUser.name },
            { auditor: currentUser.name },
            { teamLead: currentUser.name },
            { seniorManager: currentUser.name },
          ],
        });

        let chu = reports.filter(report => {
          if (
            report.createdAt >= yesterMonth &&
            report.createdAt <= nextMonth
          ) {
            console.log('report ', new Date(report.createdAt));
            return report;
          }
        });
        allReports = _.union(allReports, chu);
      } catch (error) {
        res.json({ err: 1, msg: 'SomeThing Went Wrong', error: error.message });
      }
      // res.json({ err: 0, reports: allReports });
    }

    if (currentUser.permissions.includes('viewTl')) {
      try {
        const reports = await Report.find({ teamLead: currentUser.name });
        let chu = reports.filter(report => {
          if (
            report.createdAt >= yesterMonth &&
            report.createdAt <= nextMonth
          ) {
            console.log('report ', new Date(report.createdAt));
            return report;
          }
        });
        allReports = _.union(allReports, chu);
      } catch (error) {
        res.json({ err: 1, msg: 'SomeThing Went Wrong', error: error.message });
      }
      // res.json({ err: 0, reports: allReports });
    }

    if (currentUser.permissions.includes('viewSm')) {
      try {
        const reports = await Report.find({ seniorManager: currentUser.name });
        let chu = reports.filter(report => {
          if (
            report.createdAt >= yesterMonth &&
            report.createdAt <= nextMonth
          ) {
            console.log('report ', new Date(report.createdAt));
            return report;
          }
        });
        allReports = _.union(allReports, chu);
      } catch (error) {
        res.json({ err: 1, msg: 'SomeThing Went Wrong', error: error.message });
      }
      // res.json({ err: 0, reports: allReports });
    }

    res.json({ err: 0, reports: allReports });
  }
});

//get a couselors month wise reports
router.get(
  '/counselor/allReports/:month/:counselor',
  auth,
  async (req, res) => {
    const token = req.token;
    let currentUser = await jwt.decode(token);
    const month = parseInt(req.params.month);
    const counselor = req.params.counselor;

    // const yesterMonth = new Date();
    // yesterMonth.setMonth(month - 1);
    // yesterMonth.setDate(1);
    // const nextMonth = new Date();
    // nextMonth.setMonth(month + 1);
    // nextMonth.setDate(1);
    // console.log('month ', month);

    let [yesterMonth, nextMonth] = calcDateRange(month);

    console.log('yeasterMonth ', yesterMonth);
    console.log('nextMonth', nextMonth);

    let allReports = [];

    // currentUser = await User.findOne({ email: currentUser.email });

    console.log('currentUser ', currentUser.permissions);

    try {
      const reports = await Report.find({ counselor: counselor }).sort({
        createdAt: -1,
      });

      let chu = reports.filter(report => {
        if (report.createdAt >= yesterMonth && report.createdAt <= nextMonth) {
          console.log('report ', new Date(report.createdAt));
          return report;
        }
      });
      allReports = chu;
      // console.log('allReports createdAt ', allReports[0].createdAt.getDate());
    } catch (error) {
      return res.json({
        err: 1,
        msg: 'SomeThing Went Wrong',
        error: error.message,
      });
    }
    // console.log('allReports ', allReports);
    res.json({ err: 0, reports: allReports });
  }
);

// get a team leads month wise reports
router.get('/teamlead/allReports/:month/:teamlead', auth, async (req, res) => {
  const token = req.token;
  let currentUser = await jwt.decode(token);
  const month = parseInt(req.params.month);
  const teamLead = req.params.teamlead;

  // const yesterMonth = new Date();
  // yesterMonth.setMonth(month - 1);
  // yesterMonth.setDate(1);
  // const nextMonth = new Date();
  // nextMonth.setMonth(month + 1);
  // nextMonth.setDate(1);
  // console.log('month ', month);

  let [yesterMonth, nextMonth] = calcDateRange(month);

  console.log('yeasterMonth ', yesterMonth);
  console.log('nextMonth', nextMonth);

  let allReports = [];

  // currentUser = await User.findOne({ email: currentUser.email });

  console.log('teamLead ', teamLead);

  try {
    const reports = await Report.find({ teamLead: teamLead }).sort({
      createdAt: -1,
    });
    let chu = reports.filter(report => {
      if (report.createdAt >= yesterMonth && report.createdAt <= nextMonth) {
        console.log('report ', new Date(report.createdAt));
        return report;
      }
    });
    allReports = chu;
    // console.log('allReports createdAt ', allReports[0].createdAt.getDate());
  } catch (error) {
    return res.json({
      err: 1,
      msg: 'SomeThing Went Wrong',
      error: error.message,
    });
  }
  // console.log('allReports ', allReports);
  res.json({ err: 0, reports: allReports });
});

// view recent reports
router.get('/allRecentReports/:limit/:fail?', auth, async (req, res) => {
  const token = req.token;
  let currentUser = await jwt.decode(token);
  const limit = parseInt(req.params.limit);
  const fail = req.params.fail;
  let query = {};

  if (fail == 'fail') {
    query = {
      result: 'F',
    };
  }

  if (!fail) {
    query = {
      result: {
        $not: {
          $regex: '^F',
        },
      },
    };
  }

  let allReports = [];

  // currentUser = await User.findOne({ email: currentUser.email });

  // console.log('currentUser ', currentUser.permissions);
  console.log('query ', query);

  if (
    currentUser.permissions.includes('viewAll') ||
    currentUser.permissions.includes('admin')
  ) {
    console.log('viewAll or admin permission');
    try {
      const reports = await Report.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);

      allReports = reports;
    } catch (error) {
      return res.json({
        err: 1,
        msg: 'SomeThing Went Wrong',
        error: error.message,
      });
    }
    console.log(`allReports ${fail}`, allReports);
    res.json({ err: 0, reports: allReports });
  } else {
    if (currentUser.permissions.includes('viewMy')) {
      try {
        const reports = await Report.find({
          $and: [
            {
              $or: [
                { counselor: currentUser.name },
                { auditor: currentUser.name },
                { teamLead: currentUser.name },
                { seniorManager: currentUser.name },
              ],
            },
            query,
          ],
        })
          .sort({ createdAt: -1 })
          .limit(limit);
        allReports = _.union(allReports, reports);
      } catch (error) {
        res.json({ err: 1, msg: 'SomeThing Went Wrong', error: error.message });
      }
      // res.json({ err: 0, reports: allReports });
    }

    if (currentUser.permissions.includes('viewTl')) {
      try {
        const reports = await Report.find({
          $and: [{ teamLead: currentUser.name }, query],
        })
          .sort({ createdAt: -1 })
          .limit(limit);
        allReports = _.union(allReports, reports);
      } catch (error) {
        res.json({ err: 1, msg: 'SomeThing Went Wrong', error: error.message });
      }
      // res.json({ err: 0, reports: allReports });
    }

    if (currentUser.permissions.includes('viewSm')) {
      try {
        const reports = await Report.find({
          $and: [{ seniorManager: currentUser.name }, query],
        })
          .sort({ createdAt: -1 })
          .limit(limit);
        allReports = _.union(allReports, reports);
      } catch (error) {
        res.json({ err: 1, msg: 'SomeThing Went Wrong', error: error.message });
      }
      // res.json({ err: 0, reports: allReports });
    }

    res.json({ err: 0, reports: allReports });
  }
});

export default router;
