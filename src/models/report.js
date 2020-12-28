import mongoose, { Schema } from 'mongoose';

// const questionSchema = Schema({
//   ans: Number,
//   category: {
//     type: String,
//   },
//   id: {
//     type: Number,
//     required: true,
//   },
//   marks: {
//     type: String,
//     required: true,
//   },
//   ques: {
//     type: String,
//     required: true,
//   },
// });

const reportSchema = Schema(
  {
    auditor: {
      type: String,
      required: true,
    },
    counselor: {
      type: String,
    },
    teamLead: {
      type: String,
      required: true,
    },
    seniorManager: {
      type: String,
      required: true,
    },
    callDate: {
      type: String,
      required: true,
    },
    callType: {
      type: String,
      required: true,
    },

    fatalParams: [
      {
        ans: {
          type: Number,
          required: true,
        },
        id: {
          type: Number,
          required: true,
        },
        ques: {
          type: String,
          required: true,
        },
        remarks: {
          type: String,
        },
      },
    ],

    feedback: {
      type: String,
      required: true,
    },

    leadId: {
      type: String,
      required: true,
    },
    leadPhoneNumber: {
      type: String,
      required: true,
    },
    leadStage: {
      type: String,
      required: true,
    },
    result: {
      type: String,
      required: true,
    },

    questions: [
      {
        ans: Number,
        category: {
          type: String,
        },
        id: {
          type: Number,
          required: true,
        },
        marks: {
          type: String,
          required: true,
        },
        ques: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const gradeSchema = Schema({
  score: {
    type: Number,
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  scoreCS: {
    type: Number,
    required: true,
  },
  totalMarksCS: {
    type: Number,
    required: true,
  },
  scoreP: {
    type: Number,
    required: true,
  },
  totalMarksP: {
    type: Number,
    required: true,
  },
  scorePK: {
    type: Number,
    required: true,
  },
  totalMarksPK: {
    type: Number,
    required: true,
  },
  scorePR: {
    type: Number,
    required: true,
  },
  totalMarksPR: {
    type: Number,
    required: true,
  },
});

export const Report = mongoose.model('Report', reportSchema);
export const Grade = mongoose.model('Grade', gradeSchema);
