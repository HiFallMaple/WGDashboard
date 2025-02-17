/**
 * configuration.js - Copyright(C) 2021 Donald Zou [https://github.com/donaldzou]
 * Under Apache-2.0 License
 */

(function(){
    /* global peers */
    /* global conf_name */

    /**
     * Definitions
     */
    let configuration_interval;
    let configuration_timeout = 0;
    let $progress_bar = $(".progress-bar");
    let bootstrapModalConfig = {
        keyboard: false,
        backdrop: 'static'
    };
    let addModal = new bootstrap.Modal(document.getElementById('add_modal'), bootstrapModalConfig);
    let deleteBulkModal = new bootstrap.Modal(document.getElementById('delete_bulk_modal'), bootstrapModalConfig);
    let ipModal = new bootstrap.Modal(document.getElementById('available_ip_modal'), bootstrapModalConfig);
    let qrcodeModal = new bootstrap.Modal(document.getElementById('qrcode_modal'), bootstrapModalConfig);
    let settingModal = new bootstrap.Modal(document.getElementById('setting_modal'), bootstrapModalConfig);
    let deleteModal = new bootstrap.Modal(document.getElementById('delete_modal'), bootstrapModalConfig);
    $("[data-toggle='tooltip']").tooltip();
    $("[data-toggle='popover']").popover();


    /**
     * To show alert on the configuration page
     * @param response
     */
    function configurationAlert(response) {
        if (response.listen_port === "" && response.status === "stopped"){
            let configAlert = document.createElement("div");
            configAlert.classList.add("alert");
            configAlert.classList.add("alert-warning");
            configAlert.setAttribute("role", "alert");
            configAlert.innerHTML = 'Peer QR Code and configuration file download required a specified <strong>Listen Port</strong>.';
            document.querySelector("#config_info_alert").appendChild(configAlert);
        }
        if (response.conf_address === "N/A"){
            let configAlert = document.createElement("div");
            configAlert.classList.add("alert");
            configAlert.classList.add("alert-warning");
            configAlert.setAttribute("role", "alert");
            configAlert.innerHTML = 'Configuration <strong>Address</strong> need to be specified to have peers connect to it.';
            document.querySelector("#config_info_alert").appendChild(configAlert);
        }
    }

    /**
     * Parse all responded information onto the configuration header
     * @param response
     */
    function configurationHeader(response) {
        let $conf_status_btn = document.getElementById("conf_status_btn");
        if (response.checked === "checked"){
            $conf_status_btn.innerHTML = `<a href="#" id="${response.name}" ${response.checked} class="switch text-primary"><i class="bi bi-toggle2-on"></i> ON</a>`;
        }else{
            $conf_status_btn.innerHTML = `<a href="#" id="${response.name}" ${response.checked} class="switch text-primary"><i class="bi bi-toggle2-off"></i> OFF</a>`;
        }
        $conf_status_btn.classList.remove("info_loading");
        document.querySelectorAll("#sort_by_dropdown option").forEach(ele => ele.removeAttribute("selected"));
        document.querySelector(`#sort_by_dropdown option[value="${response.sort_tag}"]`).setAttribute("selected", "selected");
        document.querySelectorAll(".interval-btn-group button").forEach(ele => ele.classList.remove("active"));
        document.querySelector(`button[data-refresh-interval="${response.dashboard_refresh_interval}"]`).classList.add("active");
        document.querySelectorAll(".display-btn-group button").forEach(ele => ele.classList.remove("active"));
        document.querySelector(`button[data-display-mode="${response.peer_display_mode}"]`).classList.add("active");
        document.querySelector("#conf_status").innerHTML = `${response.status}<span class="dot dot-${response.status}"></span>`;
        document.querySelector("#conf_connected_peers").innerHTML = response.running_peer;
        document.querySelector("#conf_total_data_usage").innerHTML = `${response.total_data_usage[0]} GB`;
        document.querySelector("#conf_total_data_received").innerHTML = `${response.total_data_usage[2]} GB`;
        document.querySelector("#conf_total_data_sent").innerHTML = `${response.total_data_usage[1]} GB`;
        document.querySelector("#conf_public_key").innerHTML = response.public_key;
        document.querySelector("#conf_listen_port").innerHTML = response.listen_port === "" ? "N/A" : response.listen_port;
        document.querySelector("#conf_address").innerHTML = response.conf_address;
        document.querySelectorAll(".info h6").forEach(ele => ele.classList.remove("info_loading"));
    }

    /**
     * Parse all responded information onto the peers list
     * @param response
     */
    function configurationPeers(response) {
        let result = "";
        if (response.peer_data.length === 0){
            document.querySelector(".peer_list").innerHTML = `<div class="col-12" style="text-align: center; margin-top: 1.5rem"><h3 class="text-muted">Oops! No peers found ‘︿’</h3></div>`;
        }else{
            let display_mode = response.peer_display_mode === "list" ? "col-12" : "col-sm-6 col-lg-4";
            response.peer_data.forEach(function(peer){
                let total_r = 0;
                let total_s = 0;
                total_r += peer.cumu_receive;
                total_s += peer.cumu_sent;
                let spliter = '<div class="w-100"></div>';
                let peer_name =
                    '<div class="col-sm display" style="display: flex; align-items: center; margin-bottom: 0.2rem">' +
                        '<h5 style="margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">'+ (peer.name === "" ? "Untitled" : peer.name) +'</h5>' +
                        '<h6 style="text-transform: uppercase; margin: 0; margin-left: auto !important;"><span class="dot dot-'+peer.status+'" style="margin-left: auto !important;" data-toggle="tooltip" data-placement="left" title="Peer Connected"></span></h6>' +
                    '</div>';
                let peer_transfer = '<div class="col-12 peer_data_group" style="text-align: right; display: flex; margin-bottom: 0.5rem"><p class="text-primary" style="text-transform: uppercase; margin-bottom: 0; margin-right: 1rem"><small><i class="bi bi-arrow-down-right"></i> '+ roundN(peer.total_receive + total_r, 4) +' GB</small></p> <p class="text-success" style="text-transform: uppercase; margin-bottom: 0"><small><i class="bi bi-arrow-up-right"></i> '+ roundN(peer.total_sent + total_s, 4) +' GB</small></p> </div>';
                let peer_key = '<div class="col-sm"><small class="text-muted" style="display: flex"><strong>PEER</strong><strong style="margin-left: auto!important; opacity: 0; transition: 0.2s ease-in-out" class="text-primary">CLICK TO COPY</strong></small> <h6><samp class="ml-auto key">'+peer.id+'</samp></h6></div>';
                let peer_allowed_ip = '<div class="col-sm"><small class="text-muted"><strong>ALLOWED IP</strong></small><h6 style="text-transform: uppercase;">'+peer.allowed_ip+'</h6></div>';
                let peer_latest_handshake = '<div class="col-sm"> <small class="text-muted"><strong>LATEST HANDSHAKE</strong></small> <h6 style="text-transform: uppercase;">'+peer.latest_handshake+'</h6> </div>';
                let peer_endpoint = '<div class="col-sm"><small class="text-muted"><strong>END POINT</strong></small><h6 style="text-transform: uppercase;">'+peer.endpoint+'</h6></div>';
                let peer_control = '<div class="col-sm"><hr><div class="button-group" style="display:flex"><button type="button" class="btn btn-outline-primary btn-setting-peer btn-control" id="'+peer.id+'" data-toggle="modal"><i class="bi bi-gear-fill" data-toggle="tooltip" data-placement="bottom" title="Peer Settings"></i></button> <button type="button" class="btn btn-outline-danger btn-delete-peer btn-control" id="'+peer.id+'" data-toggle="modal"><i class="bi bi-x-circle-fill" data-toggle="tooltip" data-placement="bottom" title="Delete Peer"></i></button>';
                if (peer.private_key !== ""){
                    peer_control += '<div class="share_peer_btn_group" style="margin-left: auto !important; display: inline"><button type="button" class="btn btn-outline-success btn-qrcode-peer btn-control" data-imgsrc="/qrcode/'+response.name+'?id='+encodeURIComponent(peer.id)+'"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="width: 19px;" fill="#28a745"><path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2zM15 19h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2z"/></svg></button><a href="/download/'+response.name+'?id='+encodeURIComponent(peer.id)+'" class="btn btn-outline-info btn-download-peer btn-control"><i class="bi bi-download"></i></a></div>';
                }
                peer_control += '</div>';
                let html = '<div class="'+display_mode+'" data-id="'+peer.id+'">' +
                                '<div class="card mb-3 card-'+peer.status+'">' +
                                    '<div class="card-body">' +
                                     '<div class="row">' +
                                        peer_name +
                                        spliter +
                                        peer_transfer +
                                        peer_key +
                                        peer_allowed_ip +
                                        peer_latest_handshake +
                                        spliter +
                                        peer_endpoint +
                                        spliter +
                                        peer_control +
                                    '</div>' +
                                '</div>' +
                                '</div>' +
                            '</div></div>';
                result += html;
            });
            document.querySelector(".peer_list").innerHTML = result;
            if (response.dashboard_refresh_interval !== configuration_timeout){
                configuration_timeout = response.dashboard_refresh_interval;
                removeConfigurationInterval();
                setConfigurationInterval();
            }
        }
    }

    /**
     * Handle when adding peers by bulk
     */
    function addPeersByBulk() {
        let $new_add_amount = $("#new_add_amount");
        $add_peer.setAttribute("disabled","disabled");
        $add_peer.innerHTML = `Adding ${$new_add_amount.val()} peers...`;
        let $new_add_DNS = $("#new_add_DNS");
        $new_add_DNS.val(window.configurations.cleanIp($new_add_DNS.val()));
        let $new_add_endpoint_allowed_ip = $("#new_add_endpoint_allowed_ip");
            $new_add_endpoint_allowed_ip.val(window.configurations.cleanIp($new_add_endpoint_allowed_ip.val()));
        let $new_add_MTU = $("#new_add_MTU");
        let $new_add_keep_alive = $("#new_add_keep_alive");
        let $enable_preshare_key = $("#enable_preshare_key");
        let data_list = [$new_add_DNS, $new_add_endpoint_allowed_ip,$new_add_MTU, $new_add_keep_alive];
        if ($new_add_amount.val() > 0 && !$new_add_amount.hasClass("is-invalid")){
            if ($new_add_DNS.val() !== "" && $new_add_endpoint_allowed_ip.val() !== ""){
                let conf = $add_peer.getAttribute('conf_id');
                let keys = [];
                for (let i = 0; i < $new_add_amount.val(); i++) {
                    keys.push(window.wireguard.generateKeypair());
                }
                $.ajax({
                    method: "POST",
                    url: "/add_peer_bulk/"+conf,
                    headers:{
                        "Content-Type": "application/json"
                    },
                    data: JSON.stringify({
                        "DNS": $new_add_DNS.val(),
                        "endpoint_allowed_ip": $new_add_endpoint_allowed_ip.val(),
                        "MTU": $new_add_MTU.val(),
                        "keep_alive": $new_add_keep_alive.val(),
                        "enable_preshared_key": $enable_preshare_key.prop("checked"),
                        "keys": keys,
                        "amount": $new_add_amount.val()
                    }),
                    success: function (response){
                        if(response !== "true"){
                            $("#add_peer_alert").html(response).removeClass("d-none");
                            data_list.forEach((ele) => ele.removeAttr("disabled"));
                            $add_peer.removeAttribute("disabled");
                            $add_peer.innerHTML = "Save";
                        }
                        else{
                            window.configurations.loadPeers("");
                            data_list.forEach((ele) => ele.removeAttr("disabled"));
                            $("#add_peer_form").trigger("reset");
                            $add_peer.removeAttribute("disabled");
                            $add_peer.innerHTML = "Save";
                            window.configurations.showToast($new_add_amount.val()+" peers added successful!");
                            window.configurations.addModal().toggle();
                        }
                    }
                });
            }else{
                $("#add_peer_alert").html("Please fill in all required box.").removeClass("d-none");
                $add_peer.removeAttribute("disabled");
                $add_peer.innerHTML = "Add";
            }
        }else{
            $add_peer.removeAttribute("disabled");
            $add_peer.innerHTML = "Add";
        }
    }

    /**
     * Delete one peer or by bulk
     * @param config
     * @param peer_ids
     */
    function deletePeers(config, peer_ids){
        $.ajax({
            method: "POST",
            url: "/remove_peer/"+config,
            headers:{
                "Content-Type": "application/json"
            },
            data: JSON.stringify({"action": "delete", "peer_ids": peer_ids}),
            success: function (response){
                if(response !== "true"){
                    if (window.configurations.deleteModal()._isShown) {
                        $("#remove_peer_alert").html(response+$("#add_peer_alert").html())
                                            .removeClass("d-none");
                        $("#delete_peer").removeAttr("disabled").html("Delete");
                    }
                    if (window.configurations.deleteBulkModal()._isShown){
                        let $bulk_remove_peer_alert = $("#bulk_remove_peer_alert");
                        $bulk_remove_peer_alert.html(response+$bulk_remove_peer_alert.html())
                                                                .removeClass("d-none");
                        $("#confirm_delete_bulk_peers").removeAttr("disabled").html("Delete");
                    }
                }
                else{
                    if (window.configurations.deleteModal()._isShown) {
                        window.configurations.deleteModal().toggle();
                    }
                    if (window.configurations.deleteBulkModal()._isShown){
                        $("#confirm_delete_bulk_peers").removeAttr("disabled").html("Delete");
                        $("#selected_peer_list").html('');
                        $(".delete-bulk-peer-item.active").removeClass('active');
                        window.configurations.deleteBulkModal().toggle();
                    }
                    window.configurations.loadPeers($('#search_peer_textbox').val());
                    $('#alertToast').toast('show');
                    $('#alertToast .toast-body').html("Peer deleted!");
                    $("#delete_peer").removeAttr("disabled").html("Delete");
                }
            }
        });
    }

    /**
     * Handle when the server is not responding
     */
    function noResponding(){
        document.querySelectorAll(".no-response").forEach(ele => ele.classList.add("active"));
        setTimeout(function (){
            document.querySelectorAll(".no-response").forEach(ele => ele.classList.add("show"));
            document.querySelector("#right_body").classList.add("no-responding");
            document.querySelector(".navbar").classList.add("no-responding");
        },10);
    }

    /**
     * Remove no responding
     */
    function removeNoResponding(){
        document.querySelectorAll(".no-response").forEach(ele => ele.classList.remove("show"));
        document.querySelector("#right_body").classList.remove("no-responding");
        document.querySelector(".navbar").classList.remove("no-responding");
        setTimeout(function (){
            document.querySelectorAll(".no-response").forEach(ele => ele.classList.remove("active"));
        },1010);
    }

    /**
     * Set configuration refresh Interval
     */
    function setConfigurationInterval(){
        configuration_interval = setInterval(function (){
            loadPeers($('#search_peer_textbox').val());
            }, configuration_timeout);
    }

    /**
     * Remove configuration refresh interval
     */
    function removeConfigurationInterval(){
        clearInterval(configuration_interval);
    }

    /**
     * Start Progress Bar
     */
    function startProgressBar(){
        $progress_bar.css("width","0%")
            .css("opacity", "100")
            .css("background", "rgb(255,69,69)")
            .css("background",
                "linear-gradient(145deg, rgba(255,69,69,1) 0%, rgba(0,115,186,1) 100%)")
            .css("width","25%");
        setTimeout(function(){
            stillLoadingProgressBar();
        },300);
    }

    /**
     * Still Loading Progress Bar
     */
    function stillLoadingProgressBar(){
        $progress_bar.css("transition", "3s ease-in-out").css("width", "75%");
    }

    /**
     * End Progress Bar
     */
    function endProgressBar(){
        $progress_bar.css("transition", "0.3s ease-in-out").css("width","100%");
        setTimeout(function(){
            $progress_bar.css("opacity", "0");
        },250);
    }

    /**
     * Round Transfer number into 4 digits
     * @param value
     * @param digits
     * @returns {number}
     */
    function roundN(value, digits) {
       let tenToN = 10 ** digits;
       return (Math.round(value * tenToN)) / tenToN;
    }

    /**
     * Load Peers from server to configuration page
     * @param searchString
     */
    let d1 = new Date();
    let time = 0;
    let count = 0;
    function loadPeers(searchString){
        startProgressBar();
        d1 = new Date();
        $.ajax({
            method: "GET",
            url: `/get_config/${conf_name}?search=${encodeURIComponent(searchString)}`,
            headers:{"Content-Type": "application/json"}
        }).done(function(response){
            removeNoResponding();
            peers = response.peer_data;
            configurationAlert(response);
            configurationHeader(response);
            configurationPeers(response);
            $(".dot.dot-running").attr("title","Peer Connected").tooltip();
            $(".dot.dot-stopped").attr("title","Peer Disconnected").tooltip();
            $("i[data-toggle='tooltip']").tooltip();
            endProgressBar();
            let d2 = new Date();
            let seconds = (d2 - d1);
            time += seconds;
            count += 1;
            console.log(`Average ${time/count}ms`);
            $("#peer_loading_time").html(`Peer Loading Time: ${seconds}ms`);
        }).fail(function(){
            noResponding();
        });
    }

    /**
     * Generate Private and Public key for a new peer
     */
    function generate_key(){
        let keys = window.wireguard.generateKeypair();
        document.querySelector("#private_key").value = keys.privateKey;
        document.querySelector("#public_key").value = keys.publicKey;
        document.querySelector("#add_peer_alert").classList.add("d-none");
        document.querySelector("#re_generate_key i").classList.remove("rotating");
        document.querySelector("#enable_preshare_key").value = keys.presharedKey;
    }

    /**
     * Show toast
     * @param msg
     */
    function showToast(msg) {
        $('#alertToast').toast('show');
        $('#alertToast .toast-body').html(msg);
    }

    /**
     * Update peer's refresh interval
     * @param res
     * @param interval
     */
    function updateRefreshInterval(res, interval) {
        if (res === "true"){
            configuration_timeout = interval;
            removeConfigurationInterval();
            setConfigurationInterval();
            showToast("Refresh Interval set to "+Math.round(interval/1000)+" seconds");
        }else{
            $(".interval-btn-group button").removeClass("active");
            $('.interval-btn-group button[data-refresh-interval="'+configuration_timeout+'"]').addClass("active");
            showToast("Refresh Interval set unsuccessful");
        }
    }

    /**
     * Clean IP
     * @param val
     * @returns {string}
     */
    function cleanIp(val){
        let clean_ip = val.split(',');
        for (let i = 0; i < clean_ip.length; i++) {
            clean_ip[i] = clean_ip[i].trim(' ');
        }
        return clean_ip.filter(Boolean).join(",");
    }

    /**
     * Trigger IP badge and item
     * @param ip
     */
    function trigger_ip(ip){
        let $ip_ele = document.querySelector(`.available-ip-item[data-ip='${ip}']`);
        if ($ip_ele){
            if ($ip_ele.classList.contains("active")){
                $ip_ele.classList.remove("active");
                document.querySelector(`#selected_ip_list .badge[data-ip='${ip}']`).remove();
            }else{
                $ip_ele.classList.add("active");
                document.querySelector("#selected_ip_list").innerHTML += `<span class="badge badge-primary available-ip-badge" style="cursor: pointer" data-ip="${ip}">${ip}</span>`;
            }
        }
    }

    /**
     * Download single configuration file
     * @param conf
     */
    function download_one_config(conf){
        let link = document.createElement('a');
        link.download = conf.filename;
        let blob = new Blob([conf.content], {type: 'text/conf'});
        link.href = window.URL.createObjectURL(blob);
        link.click();
    }

    /**
     * Toggle delete by bulk IP
     * @param element
     */
    function toggleBulkIP(element){
        let $selected_peer_list = $("#selected_peer_list");
        let id = element.data("id");
        let name = element.data("name") === "" ? "Untitled Peer" : element.data("name");
         if (element.hasClass("active")){
            element.removeClass("active");
            $("#selected_peer_list .badge[data-id='"+id+"']").remove();
        }else{
            element.addClass("active");
            $selected_peer_list.append('<span class="badge badge-danger delete-peer-bulk-badge" style="cursor: pointer; text-overflow: ellipsis; max-width: 100%; overflow-x: hidden" data-id="'+id+'">'+name+' - '+id+'</span>');
        }
    }

    /**
     * Copy public keys to clipboard
     * @param element
     */
    function copyToClipboard(element) {
        let $temp = $("<input>");
        $body.append($temp);
        $temp.val($(element).text()).trigger( "select" );
        document.execCommand("copy");
        $temp.remove();
    }

    /**
     * Get all available IP for this configuration
     */
    function getAvailableIps(){
        $.ajax({
            "url": `/available_ips/${$add_peer.getAttribute("conf_id")}`,
            "method": "GET",
        }).done(function (res) {
            available_ips = res;
            let $list_group = document.querySelector("#available_ip_modal .modal-body .list-group");
            $list_group.innerHTML = "";
            let tmp_str = "";
            document.querySelector("#allowed_ips").value = available_ips[0];
            available_ips.forEach((ip) =>
                tmp_str +=
                    `<a class="list-group-item list-group-item-action available-ip-item" style="cursor: pointer" data-ip="${ip}">${ip}</a>`);
            $list_group.innerHTML = tmp_str;
        });
    }

    window.configurations = {
        addModal: () => { return addModal; },
        deleteBulkModal: () => { return deleteBulkModal; },
        deleteModal: () => { return deleteModal; },
        ipModal: () => { return ipModal; },
        qrcodeModal: () => { return qrcodeModal; },
        settingModal: () => { return settingModal; },

        loadPeers: (searchString) => { loadPeers(searchString); },
        addPeersByBulk: () => { addPeersByBulk(); },
        deletePeers: (config, peers_ids) => { deletePeers(config, peers_ids); },


        getAvailableIps: () => { getAvailableIps(); },
        generateKeyPair: () => { generate_key(); },
        showToast: (message) => { showToast(message); },
        updateRefreshInterval: (res, interval) => { updateRefreshInterval(res, interval); },
        copyToClipboard: (element) => { copyToClipboard(element); },
        toggleDeleteByBulkIP: (element) => { toggleBulkIP(element); },
        downloadOneConfig: (conf) => { download_one_config(conf); },
        triggerIp: (ip) => { trigger_ip(ip); },
        cleanIp: (val) => { return cleanIp(val); },
        startProgressBar: () => { startProgressBar(); },
        stillLoadingProgressBar: () => { stillLoadingProgressBar(); },
        endProgressBar: () => { endProgressBar(); }
    };
})();

let $body = $("body");
let available_ips = [];
let $add_peer = document.getElementById("save_peer");

/**
 * ==========
 * Add peers
 * ==========
 */

/**
 * Toggle add peers modal when add button clicked
 */
document.querySelector(".add_btn").addEventListener("click", () => {
    window.configurations.addModal().toggle();
});

/**
 * When configuration switch got click
 */
document.querySelector(".info").addEventListener("click", (event) => {
    let selector = document.querySelector(".switch");
    if (selector.contains(event.target)){
        selector.style.display = "none";
        document.querySelector('div[role=status]').style.display = "inline-block";
        location.replace(`/switch/${selector.getAttribute("id")}`);
    }
});

/**
 * Generate Public key when private got change
 */
document.querySelector("#private_key").addEventListener("change", (event) => {
    let publicKey = document.querySelector("#public_key");
    if (event.target.value.length === 44){
        publicKey.value = window.wireguard.generatePublicKey(event.target.value);
        publicKey.setAttribute("disabled", "disabled");
    }else{
        publicKey.attributes.removeNamedItem("disabled");
        publicKey.value = "";
    }
});

/**
 * Handle when add modal is show and hide
 */
$('#add_modal').on('show.bs.modal', function () {
    window.configurations.generateKeyPair();
    window.configurations.getAvailableIps();
}).on('hide.bs.modal', function(){
    $("#allowed_ips_indicator").html('');
});

/**
 * Handle when user clicked the regenerate button
 */
$("#re_generate_key").on("click",function (){
    $("#public_key").attr("disabled","disabled");
    $("#re_generate_key i").addClass("rotating");
    window.configurations.generateKeyPair();
});

/**
 * Handle when user is editing in allowed ips textbox
 */
$("#allowed_ips").on("keyup", function(){
    let s = window.configurations.cleanIp($(this).val());
    s = s.split(",");
    if (available_ips.includes(s[s.length - 1])){
        $("#allowed_ips_indicator").removeClass().addClass("text-success")
            .html('<i class="bi bi-check-circle-fill"></i>');
    }else{
        $("#allowed_ips_indicator").removeClass().addClass("text-warning")
            .html('<i class="bi bi-exclamation-circle-fill"></i>');
    }
});

/**
 * Change peer name when user typing in peer name textbox
 */
$("#peer_name_textbox").on("keyup", function(){
    $(".peer_name").html($(this).val());
});

/**
 * When Add Peer button got clicked
 */
$add_peer.addEventListener("click",function(){
    let $bulk_add = $("#bulk_add");
    if ($bulk_add.prop("checked")){
        if (!$("#new_add_amount").hasClass("is-invalid")){
           window.configurations.addPeersByBulk();
        }
    } else {
        let $public_key = $("#public_key");
        let $private_key = $("#private_key");
        let $allowed_ips = $("#allowed_ips");
        $allowed_ips.val(window.configurations.cleanIp($allowed_ips.val()));
        let $new_add_DNS = $("#new_add_DNS");
        $new_add_DNS.val(window.configurations.cleanIp($new_add_DNS.val()));
        let $new_add_endpoint_allowed_ip = $("#new_add_endpoint_allowed_ip");
        $new_add_endpoint_allowed_ip.val(window.configurations.cleanIp($new_add_endpoint_allowed_ip.val()));
        let $new_add_name = $("#new_add_name");
        let $new_add_MTU = $("#new_add_MTU");
        let $new_add_keep_alive = $("#new_add_keep_alive");
        let $enable_preshare_key = $("#enable_preshare_key");
        $add_peer.setAttribute("disabled","disabled");
        $add_peer.innerHTML = "Adding...";
        if ($allowed_ips.val() !== "" && $public_key.val() !== "" && $new_add_DNS.val() !== "" && $new_add_endpoint_allowed_ip.val() !== ""){
            let conf = $add_peer.getAttribute('conf_id');
            let data_list = [$private_key, $allowed_ips, $new_add_name, $new_add_DNS, $new_add_endpoint_allowed_ip,$new_add_MTU, $new_add_keep_alive];
            data_list.forEach((ele) => ele.attr("disabled", "disabled"));
            $.ajax({
                method: "POST",
                url: "/add_peer/"+conf,
                headers:{
                    "Content-Type": "application/json"
                },
                data: JSON.stringify({
                    "private_key":$private_key.val(),
                    "public_key":$public_key.val(),
                    "allowed_ips": $allowed_ips.val(),
                    "name":$new_add_name.val(),
                    "DNS": $new_add_DNS.val(),
                    "endpoint_allowed_ip": $new_add_endpoint_allowed_ip.val(),
                    "MTU": $new_add_MTU.val(),
                    "keep_alive": $new_add_keep_alive.val(),
                    "enable_preshared_key": $enable_preshare_key.prop("checked"),
                    "preshared_key": $enable_preshare_key.val()
                }),
                success: function (response){
                    if(response !== "true"){
                        $("#add_peer_alert").html(response).removeClass("d-none");
                        data_list.forEach((ele) => ele.removeAttr("disabled"));
                        $add_peer.removeAttribute("disabled");
                        $add_peer.innerHTML = "Save";
                    }
                    else{
                        window.configurations.loadPeers("");
                        data_list.forEach((ele) => ele.removeAttr("disabled"));
                        $("#add_peer_form").trigger("reset");
                        $add_peer.removeAttribute("disabled");
                        $add_peer.innerHTML = "Save";
                        window.configurations.showToast("Add peer successful!");
                        window.configurations.addModal().toggle();
                    }
                }
            });
        }else{
            $("#add_peer_alert").html("Please fill in all required box.").removeClass("d-none");
            $add_peer.removeAttribute("disabled");
            $add_peer.innerHTML = "Add";
        }
    }
});

/**
 *  Handle when user is typing the amount of peers they want to add, and will check if the amount is less than 1 or
 *  is larger than the amount of available ips
 */
$("#new_add_amount").on("keyup", function(){
    let $bulk_amount_validation = $("#bulk_amount_validation");
    // $(this).removeClass("is-valid").addClass("is-invalid");
    if ($(this).val().length > 0){
        if (isNaN($(this).val())){
            $(this).removeClass("is-valid").addClass("is-invalid");
            $bulk_amount_validation.html("Please enter a valid integer");
        }else if ($(this).val() > available_ips.length){
            $(this).removeClass("is-valid").addClass("is-invalid");
            $bulk_amount_validation.html(`Cannot create more than ${available_ips.length} peers.`);
        }else if ($(this).val() < 1){
            $(this).removeClass("is-valid").addClass("is-invalid");
            $bulk_amount_validation.html("Please enter at least 1 or more.");
        }else{
            $(this).removeClass("is-invalid").addClass("is-valid");
        }
    }else{
        $(this).removeClass("is-invalid").removeClass("is-valid");
    }
});

/**
 * Handle when user toggled add peers by bulk
 */
$("#bulk_add").on("change", function (){
    let hide = $(".non-bulk").find("input");
    let amount = $("#new_add_amount");
    if ($(this).prop("checked") === true){
        for(let i = 0; i < hide.length; i++){
            $(hide[i]).attr("disabled", "disabled");
        }
        amount.removeAttr("disabled");
    }
    else{
        for(let i = 0; i < hide.length; i++){
            if ($(hide[i]).attr('id') !== "public_key"){
                $(hide[i]).removeAttr("disabled");
            }
        }
        amount.attr("disabled", "disabled");
    }
});


/**
 * =======================
 * Available IP Related
 * =======================
 */

/**
 * Handle when available ip modal show and hide
 */
$("#available_ip_modal").on("show.bs.modal", () => {
    document.querySelector('#add_modal').classList.add("ip_modal_open");
}).on("hidden.bs.modal", () => {
    document.querySelector('#add_modal').classList.remove("ip_modal_open");
    let ips = [];
    let $selected_ip_list = document.querySelector("#selected_ip_list");
    for (let i = 0; i < $selected_ip_list.childElementCount; i++){
        ips.push($selected_ip_list.children[i].dataset.ip);
    }
    ips.forEach((ele) => window.configurations.triggerIp(ele));
});

/**
 * When IP Badge got click
 */
$body.on("click", ".available-ip-badge", function(){
    $(".available-ip-item[data-ip='"+$(this).data("ip")+"']").removeClass("active");
    $(this).remove();
});

/**
 * When available ip item got click
 */
$body.on("click", ".available-ip-item", function () {
    window.configurations.triggerIp($(this).data("ip"));
});

/**
 * When search IP button got clicked
 */
$("#search_available_ip").on("click", function () {
    window.configurations.ipModal().toggle();
    let $allowed_ips = document.querySelector("#allowed_ips");
    if ($allowed_ips.value.length > 0){
        let s = $allowed_ips.value.split(",");
        for (let i = 0; i < s.length; i++){
            s[i] = s[i].trim();
            window.configurations.triggerIp(s[i]);
        }
    }
}).tooltip();

/**
 * When confirm IP is clicked
 */
$("#confirm_ip").on("click", () => {
    window.configurations.ipModal().toggle();
    let ips = [];
    let $selected_ip_list = $("#selected_ip_list");
    $selected_ip_list.children().each(function(){
        ips.push($(this).data("ip"));
    });
    $("#allowed_ips").val(ips.join(", "));
    ips.forEach((ele) => window.configurations.triggerIp(ele));
});

/**
 * =======
 * QR Code
 * =======
 */

/**
 * When the QR-code button got clicked on each peer
 */
$body.on("click", ".btn-qrcode-peer", function (){
    let src = $(this).data('imgsrc');
    $.ajax({
        "url": src,
        "method": "GET"
    }).done(function(res){
        $("#qrcode_img").attr('src', res);
        window.configurations.qrcodeModal().toggle();
    });
});

/**
 * ===========
 * Delete Peer
 * ===========
 */

/**
 * When the delete button got clicked on each peer
 */
$body.on("click", ".btn-delete-peer", function(){
    let peer_id = $(this).attr("id");
    $("#delete_peer").attr("peer_id", peer_id);
    window.configurations.deleteModal().toggle();
});

/**
 * When the confirm delete button clicked
 */
$("#delete_peer").on("click",function(){
    $(this).attr("disabled","disabled");
    $(this).html("Deleting...");
    let peer_id = $(this).attr("peer_id");
    let config = $(this).attr("conf_id");
    let peer_ids = [peer_id];
    window.configurations.deletePeers(config, peer_ids);
});

/**
 * =============
 * Peer Settings
 * =============
 */

/**
 * Handle when setting button got clicked for each peer
 */
$body.on("click", ".btn-setting-peer", function(){
    window.configurations.startProgressBar();
    let peer_id = $(this).attr("id");
    $("#save_peer_setting").attr("peer_id", peer_id);
    $.ajax({
        method: "POST",
        url: "/get_peer_data/"+$("#setting_modal").attr("conf_id"),
        headers:{
            "Content-Type": "application/json"
        },
        data: JSON.stringify({"id": peer_id}),
        success: function(response){
            let peer_name = ((response.name === "") ? "Untitled" : response.name);
            $("#setting_modal .peer_name").html(peer_name);
            $("#setting_modal #peer_name_textbox").val(response.name);
            $("#setting_modal #peer_private_key_textbox").val(response.private_key);
            $("#setting_modal #peer_DNS_textbox").val(response.DNS);
            $("#setting_modal #peer_allowed_ip_textbox").val(response.allowed_ip);
            $("#setting_modal #peer_endpoint_allowed_ips").val(response.endpoint_allowed_ip);
            $("#setting_modal #peer_mtu").val(response.mtu);
            $("#setting_modal #peer_keep_alive").val(response.keep_alive);
            $("#setting_modal #peer_preshared_key_textbox").val(response.preshared_key);
            window.configurations.settingModal().toggle();
            window.configurations.endProgressBar();
        }
    });
});

/**
 * Handle when setting modal is closing
 */
$('#setting_modal').on('hidden.bs.modal', function () {
  $("#setting_peer_alert").addClass("d-none");
});

/**
 * Handle when private key text box in setting modal got changed
 */
$("#peer_private_key_textbox").on("change",function(){
    let $save_peer_setting = $("#save_peer_setting");
    if ($(this).val().length > 0){
        $.ajax({
            "url": "/check_key_match/"+$save_peer_setting.attr("conf_id"),
            "method": "POST",
            "headers":{"Content-Type": "application/json"},
            "data": JSON.stringify({
                "private_key": $("#peer_private_key_textbox").val(),
                "public_key": $save_peer_setting.attr("peer_id")
            })
        }).done(function(res){
            if(res.status === "failed"){
                $("#setting_peer_alert").html(res.status).removeClass("d-none");
            }else{
                $("#setting_peer_alert").addClass("d-none");
            }
        });
    }
});

/**
 * When save peer setting button got clicked
 */
$("#save_peer_setting").on("click",function (){
    $(this).attr("disabled","disabled");
    $(this).html("Saving...");
    let $peer_DNS_textbox = $("#peer_DNS_textbox");
    let $peer_allowed_ip_textbox = $("#peer_allowed_ip_textbox");
    let $peer_endpoint_allowed_ips = $("#peer_endpoint_allowed_ips");
    let $peer_name_textbox = $("#peer_name_textbox");
    let $peer_private_key_textbox = $("#peer_private_key_textbox");
    let $peer_preshared_key_textbox = $("#peer_preshared_key_textbox");
    let $peer_mtu = $("#peer_mtu");
    let $peer_keep_alive = $("#peer_keep_alive");

    if ($peer_DNS_textbox.val() !== "" &&
        $peer_allowed_ip_textbox.val() !== "" && $peer_endpoint_allowed_ips.val() !== ""){
        let peer_id = $(this).attr("peer_id");
        let conf_id = $(this).attr("conf_id");
        let data_list = [$peer_name_textbox, $peer_DNS_textbox, $peer_private_key_textbox, $peer_preshared_key_textbox, $peer_allowed_ip_textbox, $peer_endpoint_allowed_ips, $peer_mtu, $peer_keep_alive];
        data_list.forEach((ele) => ele.attr("disabled","disabled"));
        $.ajax({
            method: "POST",
            url: "/save_peer_setting/"+conf_id,
            headers:{
                "Content-Type": "application/json"
            },
            data: JSON.stringify({
                id: peer_id,
                name: $peer_name_textbox.val(),
                DNS: $peer_DNS_textbox.val(),
                private_key: $peer_private_key_textbox.val(),
                allowed_ip: $peer_allowed_ip_textbox.val(),
                endpoint_allowed_ip: $peer_endpoint_allowed_ips.val(),
                MTU: $peer_mtu.val(),
                keep_alive: $peer_keep_alive.val(),
                preshared_key: $peer_preshared_key_textbox.val()
            }),
            success: function (response){
                if (response.status === "failed"){
                    $("#setting_peer_alert").html(response.msg).removeClass("d-none");
                }else{
                    window.configurations.settingModal().toggle();
                    window.configurations.loadPeers($('#search_peer_textbox').val());
                    $('#alertToast').toast('show');
                    $('#alertToast .toast-body').html("Peer Saved!");
                }
                $("#save_peer_setting").removeAttr("disabled").html("Save");
                data_list.forEach((ele) => ele.removeAttr("disabled"));
            }
        });
        }else{
        $("#setting_peer_alert").html("Please fill in all required box.").removeClass("d-none");
        $("#save_peer_setting").removeAttr("disabled").html("Save");
    }
});

/**
 * Toggle show or hide for the private key textbox in the setting modal
 */
$(".peer_private_key_textbox_switch").on("click",function (){
    let $peer_private_key_textbox = $("#peer_private_key_textbox");
    let mode = (($peer_private_key_textbox.attr('type') === 'password') ? "text":"password");
    let icon = (($peer_private_key_textbox.attr('type') === 'password') ? "bi bi-eye-slash-fill":"bi bi-eye-fill");
    $peer_private_key_textbox.attr('type',mode);
    $(".peer_private_key_textbox_switch i").removeClass().addClass(icon);
});

/**
 * ===========
 * Search Peer
 * ===========
 */

let typingTimer;  // Timeout object
let doneTypingInterval = 200; // Timeout interval

/**
 * Handle when the user keyup and keydown on the search textbox
 */
$('#search_peer_textbox').on('keyup', function () {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        window.configurations.loadPeers($(this).val());
    }, doneTypingInterval);
}).on('keydown', function () {
    clearTimeout(typingTimer);
});

/**
 * Manage Peers
 */

/**
 * Handle when sort peers changed
 */
$body.on("change", "#sort_by_dropdown", function (){
    $.ajax({
        method:"POST",
        data: JSON.stringify({'sort':$("#sort_by_dropdown option:selected").val()}),
        headers:{"Content-Type": "application/json"},
        url: "/update_dashboard_sort",
        success: function (){
            window.configurations.loadPeers($('#search_peer_textbox').val());
        }
    });
});

/**
 * Handle copy public key
 */
$body.on("mouseenter", ".key", function(){
    let label = $(this).parent().siblings().children()[1];
    label.style.opacity = "100";
}).on("mouseout", ".key", function(){
    let label = $(this).parent().siblings().children()[1];
    label.style.opacity = "0";
    setTimeout(function (){
        label.innerHTML = "CLICK TO COPY";
    },200);
}).on("click", ".key", function(){
    let label = $(this).parent().siblings().children()[1];
    window.configurations.copyToClipboard($(this));
    label.innerHTML = "COPIED!";
});

/**
 * Handle when interval button got clicked
 */
$body.on("click", ".update_interval", function(){
    $(".interval-btn-group button").removeClass("active");
    let _new = $(this);
    _new.addClass("active");
    let interval = $(this).data("refresh-interval");
    $.ajax({
        method:"POST",
        data: "interval="+$(this).data("refresh-interval"),
        url: "/update_dashboard_refresh_interval",
        success: function (res){
            window.configurations.updateRefreshInterval(res, interval);
        }
    });
});

/**
 * Handle when refresh button got clicked
 */
$body.on("click", ".refresh", function (){
    window.configurations.loadPeers($('#search_peer_textbox').val());
});

/**
 * Handle when display mode button got clicked
 */
$body.on("click", ".display_mode", function(){
    $(".display-btn-group button").removeClass("active");
    $(this).addClass("active");
    let display_mode = $(this).data("display-mode");
    $.ajax({
        method:"GET",
        url: "/switch_display_mode/"+$(this).data("display-mode"),
        success: function (res){
           if (res === "true"){
                if (display_mode === "list"){
                Array($(".peer_list").children()).forEach(function(child){
                    $(child).removeClass().addClass("col-12");
                });
                window.configurations.showToast("Displaying as List");
            }else{
               Array($(".peer_list").children()).forEach(function(child){
                    $(child).removeClass().addClass("col-sm-6 col-lg-4");
               });
               window.configurations.showToast("Displaying as Grids");
            }
           }
        }
    });
});


/**
 * =================
 * Configuration Menu
 * =================
 */
let $setting_btn_menu = $(".setting_btn_menu");
$setting_btn_menu.css("top", ($setting_btn_menu.height() + 54)*(-1));
let $setting_btn = $(".setting_btn");

/**
 * When the menu button got clicked
 */
$setting_btn.on("click", function(){
    if ($setting_btn_menu.hasClass("show")){
        $setting_btn_menu.removeClass("showing");
        setTimeout(function(){
            $setting_btn_menu.removeClass("show");
        }, 201);
    }else{
         $setting_btn_menu.addClass("show");
         setTimeout(function(){
             $setting_btn_menu.addClass("showing");
         },10);
    }
});

/**
 * Whenever the user clicked, if it is outside the menu and the menu is opened, hide the menu
 */
$("html").on("click", function(r){
    if (document.querySelector(".setting_btn") !== r.target){
        if (!document.querySelector(".setting_btn").contains(r.target)){
            if (!document.querySelector(".setting_btn_menu").contains(r.target)){
                $setting_btn_menu.removeClass("showing");
                setTimeout(function(){
                    $setting_btn_menu.removeClass("show");
                }, 310);
            }
        }
    }
});


/**
 * ====================
 * Delete Peers by Bulk
 * ====================
 */

/**
 * When delete peers by bulk clicked
 */
$("#delete_peers_by_bulk_btn").on("click", () => {
    let $delete_bulk_modal_list = $("#delete_bulk_modal .list-group");
    $delete_bulk_modal_list.html('');
    peers.forEach((peer) => {
        let name;
        if (peer.name === "") { name = "Untitled Peer"; }
        else { name = peer.name; }
        $delete_bulk_modal_list.append('<a class="list-group-item list-group-item-action delete-bulk-peer-item" style="cursor: pointer" data-id="' +
            peer.id + '" data-name="'+name+'">'+name+'<br><code>'+peer.id+'</code></a>');
    });
    window.configurations.deleteBulkModal().toggle();
});

/**
 * When the item or tag of delete peers by bulk got clicked
 */
$body.on("click", ".delete-bulk-peer-item", function(){
    window.configurations.toggleDeleteByBulkIP($(this));
}).on("click", ".delete-peer-bulk-badge", function(){
    window.configurations.toggleDeleteByBulkIP($(".delete-bulk-peer-item[data-id='" + $(this).data("id") + "']"));
});

let $selected_peer_list = document.getElementById("selected_peer_list");

/**
 * The change observer to observe when user choose 1 or more peers to delete
 * @type {MutationObserver}
 */
let changeObserver = new MutationObserver(function(){
    if ($selected_peer_list.hasChildNodes()){
        $("#confirm_delete_bulk_peers").removeAttr("disabled");
    }else{
        $("#confirm_delete_bulk_peers").attr("disabled", "disabled");
    }
});
changeObserver.observe($selected_peer_list, {
    attributes: true,
    childList: true,
    characterData: true
});

let confirm_delete_bulk_peers_interval;

/**
 * When the user clicked the delete button in the delete peers by bulk
 */
$("#confirm_delete_bulk_peers").on("click", function(){
    let btn = $(this);
    if (confirm_delete_bulk_peers_interval !== undefined){
        clearInterval(confirm_delete_bulk_peers_interval);
        confirm_delete_bulk_peers_interval = undefined;
        btn.html("Delete");
    }else{
        let timer = 5;
        btn.html(`Deleting in ${timer} secs... Click to cancel`);
        confirm_delete_bulk_peers_interval = setInterval(function(){
            timer -= 1;
            btn.html(`Deleting in ${timer} secs... Click to cancel`);
            if (timer === 0){
                btn.html(`Deleting...`);
                btn.attr("disabled", "disabled");
                let ips = [];
                $selected_peer_list.childNodes.forEach((ele) => ips.push(ele.dataset.id));
                window.configurations.deletePeers(btn.data("conf"), ips);
                clearInterval(confirm_delete_bulk_peers_interval);
                confirm_delete_bulk_peers_interval = undefined;
            }
        }, 1000);
    }
});

/**
 * Select all peers to delete
 */
$("#select_all_delete_bulk_peers").on("click", function(){
   $(".delete-bulk-peer-item").each(function(){
       if (!$(this).hasClass("active")) {
           window.configurations.toggleDeleteByBulkIP($(this));
       }
   });
});

/**
 * When delete peers by bulk window is hidden
 */
$(window.configurations.deleteBulkModal()._element).on("hidden.bs.modal", function(){
    $(".delete-bulk-peer-item").each(function(){
       if ($(this).hasClass("active")) {
           window.configurations.toggleDeleteByBulkIP($(this));
       }
   });
});

/**
 * ==============
 * Download Peers
 * ==============
 */

/**
 * When the download peers button got clicked
 */
$body.on("click", ".btn-download-peer", function(e){
    e.preventDefault();
    let link = $(this).attr("href");
    $.ajax({
        "url": link,
        "method": "GET",
        success: function(res){
            window.configurations.downloadOneConfig(res);
        }
    });
});

/**
 * When the download all peers got clicked
 */
$("#download_all_peers").on("click", function(){
    $.ajax({
        "url": $(this).data("url"),
        "method": "GET",
        success: function(res){
            if (res.peers.length > 0){
                 window.wireguard.generateZipFiles(res);
                 window.configurations.showToast("Peers' zip file download successful!");
            }else{
                window.configurations.showToast("Oops! There are no peer can be download.");
            }
        }
    });
});