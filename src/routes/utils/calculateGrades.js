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

export default calculateGrades;
