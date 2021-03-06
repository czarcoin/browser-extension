//function defs
var injectScript = function(script) {
    var elt = document.createElement("script");
    elt.innerHTML = script;
    document.head.appendChild(elt);
}

var setThumbnail = function(text){
  chrome.extension.sendMessage(text);
};

var insertAfter = function(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

var getAllBounties = async function() {
  let bounties_api_url = 'https://gitcoin.co/api/v0.1/bounties/?idx_status=open&network=mainnet&order_by=-web3_created';
  return await fetch(bounties_api_url).then(res => res.json());
}

var getBountiesForRepo = async function(github_url) {
  let bounties_api_url = `https://gitcoin.co/api/v0.1/bounties/?idx_status=open&network=mainnet&github_url=${github_url}`;
  return await fetch(bounties_api_url).then(res => res.json());
}

var getBountiesForKeyword = async function(keyword) {
  let bounties_api_url = "https://gitcoin.co/api/v0.1/bounties/?order_by=web3_created&network=mainnet&idx_status=open";
  let all_bounties = await fetch(bounties_api_url).then(res => res.json());
  let matching_bounties = [];
  for (var i = all_bounties.length - 1; i >= 0; i--) {
    var bounty_keywords = all_bounties[i].issue_description_text.toLowerCase();
    var bounty_title = all_bounties[i].title.toLowerCase();
    var does_title_contain = bounty_title.indexOf(keyword) !== -1;
    var do_keywords_contain = bounty_keywords.indexOf(keyword) !== -1;
    if (do_keywords_contain || does_title_contain) {
      matching_bounties.push(all_bounties[i])
    }
  }
  return matching_bounties;
}

const buttonStyle = `
  position: relative;
  background: green;
  color: white;
  top: 5px;
  display: inline-flex;
  padding: 0.15em 4px;
  font-size: 12px;
  font-weight: 600;
  line-height: 15px;
  color: #fff;
  border-radius: 2px;
  box-shadow: inset 0 -1px 0 rgba(27,31,35,0.12);
  height: 20px;
  align-items: center;
  text-decoration: none;
`;

var injectGetAllBountiesOnIssuesPage = async function() {
  let issue_nodes = document.getElementsByClassName('link-gray-dark');
  // console.log('injecting on issue page');
  let all_bounties = await getAllBounties();
  for (var i = issue_nodes.length - 1; i >= 0; i--) {
    var issue_name = issue_nodes[i].innerHTML.trim()
    for (var j = all_bounties.length - 1; j >= 0; j--) {
      var bounty_name = all_bounties[j].title
      var bounty_value = all_bounties[j].value_in_usdt
      var github_url = issue_nodes[i].href
      var bounty_url = "https://gitcoin.co/funding/details?url=" + github_url
      var bounty_status = all_bounties[j].status;

      if (issue_name == bounty_name) {
        var bounty_badge = document.createElement("a");
        var bounty_badge_text = document.createElement("span");
        var gitcoin_logo = document.createElement("img");
        bounty_badge.href = bounty_url;
        bounty_badge.target = "_blank";
        gitcoin_logo.src = "https://avatars1.githubusercontent.com/u/30044474?v=4";
        gitcoin_logo.setAttribute("style", "width: 16px;")
        bounty_badge.setAttribute("style", buttonStyle);
        if (bounty_status === "open") {
          var text = document.createTextNode("Open ?? $" + bounty_value);
        } else if (bounty_status === "claimed") {
          var text = document.createTextNode("Claimed ?? $" + bounty_value);
        } else {
          var text = document.createTextNode("Fulfilled ?? $" + bounty_value);
        }

        bounty_badge_text.appendChild(text);
        insertAfter(bounty_badge, issue_nodes[i])
        bounty_badge.prepend(gitcoin_logo)
        bounty_badge.append(bounty_badge_text)
      }
    }
  }
}

var injectGetAllBountiesOnIssueBoard = async function() {
  let issue_nodes = document.getElementsByClassName('zhc-issue-card__issue-title');
  let issue_parent_nodes = document.getElementsByClassName('zhc-issue-card');
  let all_bounties = await getAllBounties();
  for (var i = issue_nodes.length - 1; i >= 0; i--) {
    var issue_name = issue_nodes[i].innerHTML.trim()
    for (var j = all_bounties.length - 1; j >= 0; j--) {
      var bounty_name = all_bounties[j].title;
      var bounty_value = all_bounties[j].value_in_usdt;
      var bounty_status = all_bounties[j].status;
      var bounty_url = "https://gitcoin.co" + all_bounties[i].url;

      if (issue_name == bounty_name) {
        var bounty_badge = document.createElement("a");
        var bounty_badge_text = document.createElement("span");
        var gitcoin_logo = document.createElement("img");
        bounty_badge.href = bounty_url;
        bounty_badge.target = "_blank";
        gitcoin_logo.src = "https://avatars1.githubusercontent.com/u/30044474?v=4";
        gitcoin_logo.setAttribute("style", "width: 16px;")
        bounty_badge.setAttribute("style", buttonStyle);
        if (issue_nodes[i].nextSibling === null) {
          if (bounty_status === "open") {
            var text = document.createTextNode("Open ?? $" + bounty_value);
          } else if (bounty_status === "claimed") {
            var text = document.createTextNode("Claimed ?? $" + bounty_value);
          } else {
            var text = document.createTextNode("Fulfilled ?? $" + bounty_value);
          }

          bounty_badge_text.appendChild(text);
          insertAfter(bounty_badge, issue_nodes[i])
          bounty_badge.prepend(gitcoin_logo)
          bounty_badge.append(bounty_badge_text)
        }
      }
    }
  }
}

var addButtonToIssuePage = async function(url){
    var element = document.getElementsByClassName('issues-listing')[0];
    var bounty_anchor = document.createElement("A");
    var gitcoin_logo = document.createElement("img");
    gitcoin_logo.src = "https://avatars1.githubusercontent.com/u/30044474?v=4";
    gitcoin_logo.setAttribute("style", "width: 22px;  vertical-align: middle; margin-top: -5px;");
    bounty_anchor.className += "btn btn-sm btn-primary js-details-target gitcoin_bounty";
    bounty_anchor.setAttribute("style", "position: absolute; top: 40px; right: 0;");
    bounty_anchor.append(gitcoin_logo);

    let all_bounties = await getBountiesForRepo(url);
    if (all_bounties.length > 0) {
      bounty_anchor.href = `https://gitcoin.co/funding/details?url=${url}`;
      var bounty_eth_value = all_bounties[0].value_true;
      var bounty_usdt_value = all_bounties[0].value_in_usdt;
      var bounty_status = all_bounties[0].status;
      var bounty_text_node;
      if (bounty_status === "open") {
        bounty_text_node = document.createTextNode(`Claim issue ?? $${bounty_usdt_value}`);
      } else if (bounty_status === "fulfilled") {
        bounty_text_node = document.createTextNode(`Fulfilled issue ?? $${bounty_usdt_value}`);
      } else {
        bounty_text_node = document.createTextNode(`Claimed issue ?? $${bounty_usdt_value}`);
      }
    } else {
      bounty_anchor.href = `https://gitcoin.co/funding/new?url=${document.location.href}`;
      bounty_text_node = document.createTextNode("Fund Issue");
    }
    bounty_anchor.appendChild(bounty_text_node);
    element.appendChild(bounty_anchor);
}

var addButtonToUserPage = function() {
    var element = document.getElementsByClassName('vcard-names')[0];
    var tip_anchor = document.createElement("A");
    var tip_anchor_text = document.createElement("span");
    tip_anchor.href = "https://gitcoin.co/tip?username=" + document.getElementsByClassName('p-nickname')[0].innerHTML;
    tip_anchor.className += "btn btn-block btn-primary js-details-target gitcoin_bounty";
    tip_anchor.setAttribute("style", "display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; height: 34px; justify-content: center; align-content: center;");
    var gitcoin_logo = document.createElement("img");
    gitcoin_logo.src = "https://avatars1.githubusercontent.com/u/30044474?v=4";
    gitcoin_logo.setAttribute("style", "width: 22px;")
    var text = document.createTextNode("Tip User");
    tip_anchor.appendChild(gitcoin_logo);
    tip_anchor_text.appendChild(text);
    tip_anchor.appendChild(tip_anchor_text);
    element.appendChild(tip_anchor);
}

var humanize = function(amount){
  if(amount > (100 * 1000)){
    return Math.round(amount/1000000,1) + "m";
  }
  if(amount > (100)){
    return Math.round(amount/1000,1) + "k";
  }
  return amount;
}

var addButtonBountyAmount = function(amount,claimed,submittedByMe){
    if(amount == 0){
      return;
    }
    amount = humanize(amount);
    var element = document.getElementsByClassName('issues-listing')[0];
    var bounty_anchor = document.createElement("A");
    var css = "position: absolute; top: -55px; right: 100px; ";
    var text = "Claim Bounty ("+amount+" GIT)";
    var _class = "btn btn-sm btn-primary js-details-target gitcoin_bounty";
    var action = 'claim';
    if(claimed){
      action = 'process';
      if(submittedByMe){
        text = "Process Claim ("+amount+" GIT)";
      } else {
        text = "Pending Claim ("+amount+" GIT)";
      }
    }
    if(claimed && !submittedByMe){
      css = css + "background-color: #eeeeee;"
      _class = "btn btn-sm js-details-target";
    } else {
      css = css + "background-color: #15003e; background-image: linear-gradient(-180deg, #15003e 0%, #190032 90%); color: #25e899;";
    }

    var href = "https://gitcoin.co/funding/"+action+"?source=" + document.location.href + "&user=" + document.getElementsByName('user-login')[0].content;
    bounty_anchor.href = href;
    bounty_anchor.className += _class;
    bounty_anchor.setAttribute("style", css);
    var text = document.createTextNode(text);
    bounty_anchor.appendChild(text);
    element.appendChild(bounty_anchor);
}

var bountyABI = '[{"inputs": [{"type": "bytes32", "name": ""}], "constant": true, "name": "bountiesbyrepo", "outputs": [{"type": "uint256", "name": ""}], "payable": false, "type": "function"}, {"inputs": [{"type": "string", "name": "str"}], "constant": false, "name": "normalizeIssueURL", "outputs": [{"type": "string", "name": "result"}], "payable": false, "type": "function"}, {"inputs": [{"type": "string", "name": "str"}], "constant": false, "name": "getRepoURL", "outputs": [{"type": "string", "name": "result"}], "payable": false, "type": "function"}, {"inputs": [{"type": "string", "name": "_issueURL"}], "constant": false, "name": "claimBounty", "outputs": [], "payable": false, "type": "function"}, {"inputs": [], "constant": true, "name": "numBounties", "outputs": [{"type": "uint256", "name": ""}], "payable": false, "type": "function"}, {"inputs": [{"type": "string", "name": "_repoURL"}], "constant": false, "name": "getNumberBounties", "outputs": [{"type": "uint256", "name": ""}], "payable": false, "type": "function"}, {"inputs": [{"type": "string", "name": "_issueURL"}, {"type": "uint256", "name": "_amount"}, {"type": "address", "name": "_tokenAddress"}, {"type": "uint256", "name": "_expirationTime"}, {"type": "string", "name": "_fromUsername"}, {"type": "string", "name": "_fromEmail"}], "constant": false, "name": "postBounty", "outputs": [{"type": "bool", "name": ""}], "payable": false, "type": "function"}, {"inputs": [{"type": "string", "name": "_issueURL"}], "constant": false, "name": "rejectBountyClaim", "outputs": [], "payable": false, "type": "function"}, {"inputs": [{"type": "string", "name": "_issueURL"}], "constant": false, "name": "bountydetails", "outputs": [{"type": "uint256", "name": ""}, {"type": "address", "name": ""}, {"type": "address", "name": ""}, {"type": "address", "name": ""}, {"type": "bool", "name": ""}, {"type": "bool", "name": ""}], "payable": false, "type": "function"}, {"inputs": [{"type": "bytes32", "name": "index"}], "constant": false, "name": "_bountydetails", "outputs": [{"type": "uint256", "name": ""}, {"type": "address", "name": ""}, {"type": "address", "name": ""}, {"type": "address", "name": ""}, {"type": "bool", "name": ""}, {"type": "bool", "name": ""}], "payable": false, "type": "function"}, {"inputs": [{"type": "bytes32", "name": ""}], "constant": true, "name": "Bounties", "outputs": [{"type": "bool", "name": "initialized"}, {"type": "bool", "name": "open"}, {"type": "string", "name": "issueURL"}, {"type": "uint256", "name": "amount"}, {"type": "address", "name": "tokenAddress"}, {"type": "uint256", "name": "expirationTime"}, {"type": "string", "name": "fromUsername"}, {"type": "string", "name": "fromEmail"}, {"type": "address", "name": "bountyOwner"}, {"type": "address", "name": "claimee"}], "payable": false, "type": "function"}, {"inputs": [{"type": "string", "name": "_issueURL"}], "constant": false, "name": "approveBountyClaim", "outputs": [], "payable": false, "type": "function"}, {"inputs": [{"type": "string", "name": "str"}], "constant": false, "name": "strToMappingIndex", "outputs": [{"type": "bytes32", "name": "result"}], "payable": false, "type": "function"}, {"inputs": [{"indexed": false, "type": "address", "name": "_from"}, {"indexed": false, "type": "string", "name": "issueURL"}, {"indexed": false, "type": "uint256", "name": "amount"}], "type": "event", "name": "bountyPosted", "anonymous": false}, {"inputs": [{"indexed": false, "type": "address", "name": "_from"}, {"indexed": false, "type": "string", "name": "issueURL"}], "type": "event", "name": "bountyClaimed", "anonymous": false}, {"inputs": [{"indexed": false, "type": "address", "name": "_from"}, {"indexed": false, "type": "address", "name": "payee"}, {"indexed": false, "type": "string", "name": "issueURL"}], "type": "event", "name": "bountyClaimApproved", "anonymous": false}, {"inputs": [{"indexed": false, "type": "address", "name": "_from"}, {"indexed": false, "type": "string", "name": "issueURL"}], "type": "event", "name": "bountyClaimRejected", "anonymous": false}];';
//local
//var bountyAddress = '0x0ed0c2a859e9e576cdff840c51d29b6f8a405bdd';
//ropsten
//var bountyAddress = '0x3102118ba636942c82d1a6efa2e7d069dc2d14bd';
//mainnet
var bountyAddress = '0xc14c22f07bc8aeda9fd87c7bd579169fd6bf01b5';


var injectGetBountyAmount = function(){
    setTimeout(function(){
      var injectGetBalance = ' \
      var bounty_abi = '+bountyABI+' \
      var bounty_address = "'+bountyAddress+'"; \
      var callback = function(error, result){\
          var bountyAmount = Math.round(result[0].toNumber() * web3.fromWei("1", "ether")); \
          respond_to_ext("bountyDetails", [bountyAmount, result[1], result[2], result[3], result[4], result[5]]);\
      };\
      if(typeof web3 != "undefined"){ \
        var bounty = web3.eth.contract(bounty_abi).at(bounty_address);\
        bounty.bountydetails.call(document.location.href, callback);\
      } \
      ';

      injectScript(injectGetBalance);
    }, 1000);
}

var injectGetNumberBounties = async function(repoURL) {
  let repoKeyword = window.location.href.split('/')[4]
  let bounties = await getBountiesForKeyword(repoKeyword);
  let numBounties = bounties.length;
  setTimeout(function() {
    let injectThisCode = `
      numBounties =` + numBounties + `
      respond_to_ext("numBounties", numBounties);
    `;
    injectScript(injectThisCode);
  }, 1000);
}

var injectGetTotalBounties = function(){
    setTimeout(function(){
      var injectThisCode = ' \
      var bounty_abi = '+bountyABI+' \
      var bounty_address = "'+bountyAddress+'"; \
      var callback = function(error, result){\
          var totalBounties = result.toNumber(); \
          respond_to_ext("totalBounties", totalBounties);\
      };\
      if(typeof web3 != "undefined"){ \
        var bounty = web3.eth.contract(bounty_abi).at(bounty_address);\
        bounty.numBounties.call( callback);\
      } \
      ';

      injectScript(injectThisCode);
    }, 1000);
}
