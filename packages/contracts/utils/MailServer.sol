pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MailServer is Ownable {
    uint16 constant rsa_modulus_chunks_len = 17;
    mapping(string => uint256[rsa_modulus_chunks_len]) verifiedMailserverKeys;

    constructor() {
        // Do dig TXT outgoing._domainkey.twitter.com to verify these.
        // This is the base 2^121 representation of that key.
        // Circom bigint: represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
        initMailserverKeys();
    }

    function initMailserverKeys() internal {
        // TODO: Create a type that takes in a raw RSA key, the bit count,
        // and whether or not its base64 encoded, and converts it to either 8 or 16 signals
         verifiedMailserverKeys["gmail.com"][0] = 2107195391459410975264579855291297887;
        verifiedMailserverKeys["gmail.com"][1] = 2562632063603354817278035230349645235;
        verifiedMailserverKeys["gmail.com"][2] = 1868388447387859563289339873373526818;
        verifiedMailserverKeys["gmail.com"][3] = 2159353473203648408714805618210333973;
        verifiedMailserverKeys["gmail.com"][4] = 351789365378952303483249084740952389;
        verifiedMailserverKeys["gmail.com"][5] = 659717315519250910761248850885776286;
        verifiedMailserverKeys["gmail.com"][6] = 1321773785542335225811636767147612036;
        verifiedMailserverKeys["gmail.com"][7] = 258646249156909342262859240016844424;
        verifiedMailserverKeys["gmail.com"][8] = 644872192691135519287736182201377504;
        verifiedMailserverKeys["gmail.com"][9] = 174898460680981733302111356557122107;
        verifiedMailserverKeys["gmail.com"][10] = 1068744134187917319695255728151595132;
        verifiedMailserverKeys["gmail.com"][11] = 1870792114609696396265442109963534232;
        verifiedMailserverKeys["gmail.com"][12] = 8288818605536063568933922407756344;
        verifiedMailserverKeys["gmail.com"][13] = 1446710439657393605686016190803199177;
        verifiedMailserverKeys["gmail.com"][14] = 2256068140678002554491951090436701670;
        verifiedMailserverKeys["gmail.com"][15] = 518946826903468667178458656376730744;
        verifiedMailserverKeys["gmail.com"][16] = 3222036726675473160989497427257757;

        verifiedMailserverKeys["hotmail.com"][0] = 128339925410438117770406273090474249;
        verifiedMailserverKeys["hotmail.com"][1] = 2158906895782814996316644028571725310;
        verifiedMailserverKeys["hotmail.com"][2] = 2278019331164769360372919938620729773;
        verifiedMailserverKeys["hotmail.com"][3] = 1305319804455735154587383372570664109;
        verifiedMailserverKeys["hotmail.com"][4] = 2358345194772578919713586294428642696;
        verifiedMailserverKeys["hotmail.com"][5] = 1333692900109074470874155333266985021;
        verifiedMailserverKeys["hotmail.com"][6] = 2252956899717870524129098594286063236;
        verifiedMailserverKeys["hotmail.com"][7] = 1963190090223950324858653797870319519;
        verifiedMailserverKeys["hotmail.com"][8] = 2099240641399560863760865662500577339;
        verifiedMailserverKeys["hotmail.com"][9] = 1591320380606901546957315803395187883;
        verifiedMailserverKeys["hotmail.com"][10] = 1943831890994545117064894677442719428;
        verifiedMailserverKeys["hotmail.com"][11] = 2243327453964709681573059557263184139;
        verifiedMailserverKeys["hotmail.com"][12] = 1078181067739519006314708889181549671;
        verifiedMailserverKeys["hotmail.com"][13] = 2209638307239559037039565345615684964;
        verifiedMailserverKeys["hotmail.com"][14] = 1936371786309180968911326337008120155;
        verifiedMailserverKeys["hotmail.com"][15] = 2611115500285740051274748743252547506;
        verifiedMailserverKeys["hotmail.com"][16] = 3841983033048617585564391738126779;

        verifiedMailserverKeys["ethereum.org"][0] = 1859851589285015402364374517208607421;
        verifiedMailserverKeys["ethereum.org"][1] = 2481242972493130579716075269714038950;
        verifiedMailserverKeys["ethereum.org"][2] = 1113377260370489008142295051480623915;
        verifiedMailserverKeys["ethereum.org"][3] = 413415000215515422192897690843078165;
        verifiedMailserverKeys["ethereum.org"][4] = 321395896911577724053460117017858232;
        verifiedMailserverKeys["ethereum.org"][5] = 962219080380806566836448614909569903;
        verifiedMailserverKeys["ethereum.org"][6] = 1347473540368313871255028394615231216;
        verifiedMailserverKeys["ethereum.org"][7] = 1621587460770854960171142404501124155;
        verifiedMailserverKeys["ethereum.org"][8] = 1471486493519418571789733020624669307;
        verifiedMailserverKeys["ethereum.org"][9] = 1075518046606101497818726980522885370;
        verifiedMailserverKeys["ethereum.org"][10] = 1035273355098862691341654610092734008;
        verifiedMailserverKeys["ethereum.org"][11] = 1260143694364957878456822959976388437;
        verifiedMailserverKeys["ethereum.org"][12] = 451630895668811590034023292968645260;
        verifiedMailserverKeys["ethereum.org"][13] = 848440330274207230079809696156767021;
        verifiedMailserverKeys["ethereum.org"][14] = 1027109192564933036184004289663638570;
        verifiedMailserverKeys["ethereum.org"][15] = 615722519111225436423423623453523340;
        verifiedMailserverKeys["ethereum.org"][16] = 3348884040059470563446926933801436;

        verifiedMailserverKeys["twitter.com"][0] = 1634582323953821262989958727173988295;
        verifiedMailserverKeys["twitter.com"][1] = 1938094444722442142315201757874145583;
        verifiedMailserverKeys["twitter.com"][2] = 375300260153333632727697921604599470;
        verifiedMailserverKeys["twitter.com"][3] = 1369658125109277828425429339149824874;
        verifiedMailserverKeys["twitter.com"][4] = 1589384595547333389911397650751436647;
        verifiedMailserverKeys["twitter.com"][5] = 1428144289938431173655248321840778928;
        verifiedMailserverKeys["twitter.com"][6] = 1919508490085653366961918211405731923;
        verifiedMailserverKeys["twitter.com"][7] = 2358009612379481320362782200045159837;
        verifiedMailserverKeys["twitter.com"][8] = 518833500408858308962881361452944175;
        verifiedMailserverKeys["twitter.com"][9] = 1163210548821508924802510293967109414;
        verifiedMailserverKeys["twitter.com"][10] = 1361351910698751746280135795885107181;
        verifiedMailserverKeys["twitter.com"][11] = 1445969488612593115566934629427756345;
        verifiedMailserverKeys["twitter.com"][12] = 2457340995040159831545380614838948388;
        verifiedMailserverKeys["twitter.com"][13] = 2612807374136932899648418365680887439;
        verifiedMailserverKeys["twitter.com"][14] = 16021263889082005631675788949457422;
        verifiedMailserverKeys["twitter.com"][15] = 299744519975649772895460843780023483;
        verifiedMailserverKeys["twitter.com"][16] = 3933359104846508935112096715593287;

        verifiedMailserverKeys["skiff.com"][0] = 2637270478154147701703365710201556843;
        verifiedMailserverKeys["skiff.com"][1] = 2082690054369201099288110516791254232;
        verifiedMailserverKeys["skiff.com"][2] = 1108253255381437937379143813840625818;
        verifiedMailserverKeys["skiff.com"][3] = 1535554154331979875086566323552212673;
        verifiedMailserverKeys["skiff.com"][4] = 273019276149049264013012583938735085;
        verifiedMailserverKeys["skiff.com"][5] = 741436192387359949728618527229215889;
        verifiedMailserverKeys["skiff.com"][6] = 1851608307869135205473270393049341043;
        verifiedMailserverKeys["skiff.com"][7] = 1428718881138594152975742734455140338;
        verifiedMailserverKeys["skiff.com"][8] = 778850382237088374273157869416671135;
        verifiedMailserverKeys["skiff.com"][9] = 549599381370898291203601849666570597;
        verifiedMailserverKeys["skiff.com"][10] = 221161044322752364431317167498442512;
        verifiedMailserverKeys["skiff.com"][11] = 2041801755941244198449288035460748224;
        verifiedMailserverKeys["skiff.com"][12] = 1083114189020989870026920716001138899;
        verifiedMailserverKeys["skiff.com"][13] = 1380362773644527202561949550864154963;
        verifiedMailserverKeys["skiff.com"][14] = 1366599807917971505788646146248798329;
        verifiedMailserverKeys["skiff.com"][15] = 391565989352979266796804441125988853;
        verifiedMailserverKeys["skiff.com"][16] = 3704766395208948862861103932863036;
    }

    function _stringEq(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    function verifyKeyForDomain(string memory domain, uint256[] memory val) public view returns (bool) {
        if (verifiedMailserverKeys[domain].length == 0) {
            return false;
        }

        if (verifiedMailserverKeys[domain].length != val.length) {
            return false;
        }

        for (uint256 i = 0; i < val.length; i++) {
            if (verifiedMailserverKeys[domain][i] != val[i]) {
                return false;
            }
        }

        return true;
    }

    function editMailserverKey(string memory domain, uint256 index, uint256 val) public onlyOwner {
        verifiedMailserverKeys[domain][index] = val;
    }

    function getMailserverKey(string memory domain, uint256 index) public returns (uint256) {
        return verifiedMailserverKeys[domain][index];
    }
    
    // TODO: Add DNSSEC verification to add a key as well
}
