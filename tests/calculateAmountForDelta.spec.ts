import { calculateAmountForDelta } from "../src/lib/calculateAmountForDelta";

const config18 = {
  utime_since: 0,
  bit_price_ps: 1,
  cell_price_ps: 500,
  mc_bit_price_ps: 1000,
  mc_cell_price_ps: 500000,
};

const accountDetailsActive = {
  storageStat: {
    lastPaid: -1,
    duePayment: null,
    used: {
      bits: 4982,
      cells: 19,
      publicCells: 0,
    },
  },
};

const accountDetailsFrozen = {
  storageStat: {
    lastPaid: -1,
    duePayment: "300",
    used: {
      bits: 334,
      cells: 1,
      publicCells: 0,
    },
  },
};

const cases = [
  {
    isMasterchain: false,
    timeDeltaSec: 0,
    accountDetails: accountDetailsFrozen,
    expected: "300",
  },
  {
    isMasterchain: true,
    timeDeltaSec: 0,
    accountDetails: accountDetailsActive,
    expected: "0",
  },
  {
    isMasterchain: false,
    timeDeltaSec: 0,
    accountDetails: accountDetailsActive,
    expected: "0",
  },
  {
    isMasterchain: true,
    timeDeltaSec: 3600,
    accountDetails: accountDetailsFrozen,
    expected: "46112",
  },
  {
    isMasterchain: true,
    timeDeltaSec: 3600,
    accountDetails: accountDetailsActive,
    expected: "795520",
  },
  {
    isMasterchain: false,
    timeDeltaSec: 3600,
    accountDetails: accountDetailsFrozen,
    expected: "345",
  },
  {
    isMasterchain: false,
    timeDeltaSec: 3600,
    accountDetails: accountDetailsActive,
    expected: "795",
  },
];

describe("Calculate amount for delta", () => {
  cases.forEach(({ isMasterchain, timeDeltaSec, expected, accountDetails }) => {
    it(`Calculates amount when delta is ${timeDeltaSec} - ${
      isMasterchain ? "masterchain" : "workchain"
    } - ${
      accountDetails === accountDetailsFrozen ? "frozen" : "active"
    }`, () => {
      expect(
        calculateAmountForDelta(
          config18,
          timeDeltaSec,
          isMasterchain,
          accountDetails
        ).toString()
      ).toEqual(expected);
    });
  });
});
