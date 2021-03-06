var dao = web3.eth.contract($dao_abi).at('$dao_address');
var offer = web3.eth.contract($offer_abi).at('$offer_address');

addToTest('dao_rewardaccount_before', eth.getBalance(dao.DAOrewardAccount()));
// 'emulate' a USN node payment
offer.payReward.sendTransaction({from:eth.accounts[2], value: web3.toWei($pay_reward_amount), gas: 100000});
checkWork();
addToTest('dao_rewardaccount_after', eth.getBalance(dao.DAOrewardAccount()));
addToTest(
    'dao_rewardaccount_diff',
    web3.fromWei(bigDiff(testMap['dao_rewardaccount_after'], testMap['dao_rewardaccount_before']))
);


// The DAO will now set the daily withdrawal limit
var prop_id = attempt_proposal(
    dao, // DAO in question
    '$offer_address', // recipient
    proposalCreator, // proposal creator
    0, // proposal amount in ether
    'Set the daily withdrawal limit of SampleOffer', // description
    '$transaction_bytecode', //bytecode
    $debating_period, // debating period
    $proposal_deposit, // proposal deposit in ether
    false // whether it's a split proposal or not
);


console.log("Voting for the proposal to set the Daily withdraw limit");
for (i = 0; i < eth.accounts.length; i++) {
    dao.vote.sendTransaction(
        prop_id,
        true, //omg it's unanimous!
        {
            from: eth.accounts[i],
            gas: 1000000
        }
    );
}
checkWork();

setTimeout(function() {
    miner.stop();
    console.log("After debating period. NOW is: " + Math.floor(Date.now() / 1000));
    attempt_execute_proposal(
        dao, // target DAO
        prop_id, // proposal ID
        '$transaction_bytecode', // transaction bytecode
        proposalCreator, // proposal creator
        true, // should the proposal be closed after this call?
        true // should the proposal pass?
    );

    addToTest('offer_daily_withdraw_limit', web3.fromWei(offer.dailyWithdrawLimit()));

    addToTest('contractor_before', eth.getBalance(contractor));
    // now the contractor can attempt to withdraw some money and we should check that this
    // occurs and is equal to the daily limit
    offer.getDailyPayment.sendTransaction({from: contractor, gas: 100000});
    checkWork();
    addToTest('contractor_after', eth.getBalance(contractor));
    addToTest('contractor_diff',
              parseFloat(web3.fromWei(bigDiff(testMap['contractor_after'], testMap['contractor_before'])))
             );
    

    testResults();
}, $debating_period * 1000);
console.log("Wait for end of debating period");
miner.start(1);
