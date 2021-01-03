const calcDateRange = month => {
  let yesterMonth = new Date();
  let nextMonth = new Date();

  if (month > 0) {
    yesterMonth.setFullYear(yesterMonth.getFullYear() - 1);
    yesterMonth.setMonth(month);
    yesterMonth.setDate(1);
    yesterMonth.setUTCHours(0, 0, 0);
    yesterMonth = yesterMonth.valueOf();

    nextMonth.setFullYear(nextMonth.getFullYear() - 1);
    nextMonth.setMonth(month + 1);

    nextMonth.setDate(0);
    nextMonth.setUTCHours(23, 59, 59);
    nextMonth = nextMonth.valueOf();
  } else {
    yesterMonth.setDate(1);
    yesterMonth.setMonth(month);
    yesterMonth.setUTCHours(0, 0, 0);
    yesterMonth = yesterMonth.valueOf();

    nextMonth.setMonth(month + 1);

    nextMonth.setDate(0);
    nextMonth.setUTCHours(23, 59, 59);
    nextMonth = nextMonth.valueOf();
  }

  return [yesterMonth, nextMonth];
};

export default calcDateRange;
