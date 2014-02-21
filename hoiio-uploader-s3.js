angular.module("directive.hoiioUploaderS3", ["hoiio.configuration"])
/**
 * This directive should use with angular v1.2.0 or later
 */
    .directive("uploaderS3", function($compile, $templateCache, backendService, uploaderS3Service, configuration, CONFIG) {
        return {
            restrict: "A",
            scope: {
                label: "=?",    // Beware this operator will be available in angular v1.2.0 or later
                css: "@css",
                maxSize: "@maxsize",
                onSelected: "&onselected",
                onUpload: "&onupload",
                onComplete: "&oncomplete",
                onError: "&onerror"
            },
            link: function(scope, element) {
                scope.isUploading = false;
                var config = backendService.getConfig();

                element.fineUploaderS3({
                    template: uploaderS3Service.getTemplate(scope.css),
                    debug: configuration.app.mode === CONFIG.APP.MODE.DEV,
                    multiple: false,
                    autoUpload: false,
                    objectProperties: {
                        acl: configuration.aws.acl,
                        key: function(id) {
                            return getKey(id);
                        }
                    },
                    request: {
                        endpoint:  "https://" + configuration.aws.bucket + '.s3.amazonaws.com',
                        accessKey: configuration.aws.accessKey
                    },
                    signature: {
                        endpoint: config.apiUrl + '/upload/verify'
                    },
                    cors: {
                        expected: true,
                        allowXdr: true,
                        sendCredentials: true
                    },
                    iframeSupport: {
                        // Beware very important for uploading on IE9 or older
                        localBlankPagePath: '#/upload/callback'
                    },
                    validation: {
                        acceptFiles: ".csv",
                        allowedExtensions: ["csv"],
                        sizeLimit: scope.maxSize || 5242880
                    }
                }).on("submit", function(event, id, name) {
                        if(scope.onSelected) {
                            scope.onSelected({
                                key: getKey(id),
                                name: name
                            });
                        }
                    }).on("upload", function(event, id, name) {
                        if(scope.onUpload) {
                            scope.onUpload({
                                key: getKey(id),
                                name: name
                            });
                        }
                        scope.isUploading = true;
                    }).on("complete", function(event, id, name, responseJSON, xhr) {
                        if(scope.onComplete) {
                            scope.onComplete({
                                key: getKey(id),
                                name: name,
                                responseJSON: responseJSON,
                                xhr: xhr
                            });
                        }
                        scope.isUploading = false;
                    }).on("error", function(event, id, name, errorReason, xhr) {
                        if(scope.onError) {
                            scope.onError({
                                key: getKey(id),
                                name: name,
                                errorReason: errorReason,
                                xhr: xhr
                            });
                        }
                        scope.isUploading = false;
                    });

                scope.$watch("label", function(newValue) {
                    scope.label = newValue;
                    // wire properties in scope to upload template
                    $compile(element.find(".qq-uploader-selector"))(scope);
                });

                scope.$on("hoiioFineUploader:upload", function() {
                    element.fineUploader('uploadStoredFiles');
                });

                function getKey(id) {
                    return configuration.aws.folderName + "/" + element.fineUploader("getUuid", id) +
                        "-" + element.fineUploader("getName", id);
                }
            }
        };
    })

    .factory("uploaderS3Service", function() {
        return {
            getTemplate: function(css) {
                /**
                 * Beware If you want to change this default template, you must:
                 *
                 * 1. Add inline-style in element has qq-upload-button class with "width:auto"
                 * 2. Add ng-disabled="data.isUploading" in element has qq-upload-button class
                 * 3. Add {{label}} expression to wire name of button upload
                 * 4. Add inline-style="display:none" to element has qq-upload-list-selector class
                 *
                 */
                var script = document.createElement("div");
                $(script).html(
                    '<div class="qq-uploader-selector qq-uploader">'+
                        '<div ng-disabled="isUploading" class="qq-upload-button-selector qq-upload-button ' + (css || "") + '" style="width:auto">'+
                        '<div>{{label}} <img ng-if="isUploading" src="https://d1fnpdk9svbocx.cloudfront.net/img/ajax_loader_gray_64.gif" class="mg-l-5" style="width:16px;height:16px"> </div>'+
                        '</div>'+
                        '<ul class="qq-upload-list-selector qq-upload-list" style="display:none">'+
                        '<li>'+
                        '<div class="qq-progress-bar-container-selector">'+
                        '<div class="qq-progress-bar-selector qq-progress-bar"></div>'+
                        '</div>'+
                        '<span class="qq-upload-spinner-selector qq-upload-spinner"></span>' +
                        '<span class="qq-edit-filename-icon-selector qq-edit-filename-icon"></span>' +
                        '<span class="qq-upload-file-selector qq-upload-file"></span>' +
                        '<input class="qq-edit-filename-selector qq-edit-filename" tabindex="0" type="text">' +
                        '<span class="qq-upload-size-selector qq-upload-size"></span>' +
                        '<a class="qq-upload-cancel-selector qq-upload-cancel" href="#">Cancel</a>' +
                        '<a class="qq-upload-retry-selector qq-upload-retry" href="#">Retry</a>' +
                        '<a class="qq-upload-delete-selector qq-upload-delete" href="#">Delete</a>' +
                        '<span class="qq-upload-status-text-selector qq-upload-status-text"></span>' +
                        '</li>' +
                        '</ul>' +
                        '</div>');
                return script;
            }
        };
    });