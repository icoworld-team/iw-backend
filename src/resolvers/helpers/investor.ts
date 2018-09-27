export function generateSearchingParamsObject(filteredParams) {
  const result = {} as any;

  if (filteredParams.name !== undefined) {
    result.name = new RegExp(`.*${filteredParams.name}.*`, 'i');
  }

  if (filteredParams.country !== undefined) {
    result.country = filteredParams.country;
  }

  if (filteredParams.followersRangeFilter !== undefined) {
    if (filteredParams.followersRangeFilter.from !== undefined) {
      const countOfFollowersFrom = `this.follows.length >= ${filteredParams.followersRangeFilter.from}`
      result.$where = countOfFollowersFrom;
    }

    if (filteredParams.followersRangeFilter.to !== undefined) {
      const countOfFollowersTo = `this.follows.length <= ${filteredParams.followersRangeFilter.to}`;
      if (result.$where) {
        result.$where = `${result.$where} && ${countOfFollowersTo}`;
      } else {
        result.$where = `${countOfFollowersTo}`;
      }
    }
  }

  return result;
}

export function sortInvestors(investors, sortBy) {
  switch (sortBy) {
    case 'NUMBER_OF_FOLLOWERS':
      return investors.sort((investors1, investors2) => investors2.subscribers.length - investors1.subscribers.length);
    case 'REGISTRATION_DATE':
      return investors.sort((investors1, investors2) => investors2.createdAt - investors1.createdAt);
    /* case 'CAPITAL_AMOUNT':
      return {};
    case 'PROFIT_LEVEL':
      return {};
    case 'PERCENTAGE_OF_PROFITABLE_INVESTMENTS':
      return {}; */   
    default:
      return investors;
  }
}

// Format investor object
export function formatInvestor(investor) {
  return {
      id: investor._id,
      name: investor.name,
      login: investor.login,
      countOfFollowers: investor.subscribers.length
  }
}