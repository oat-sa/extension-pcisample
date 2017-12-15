<div class="panel">
    <label for="" class="has-icon">{{__ "Page height (px)"}}</label>
    <span class="icon-help tooltipstered" data-tooltip="~ .tooltip-content:first" data-tooltip-theme="info"></span>
    <div class="tooltip-content">{{__ 'Page height (px).'}}</div>
    <select name="pageHeight" class="select2 js-page-height-select" data-has-search="false">
        <option value="auto">auto</option>
        <option value="200">200</option>
        <option value="400">400</option>
        <option value="600">600</option>
    </select>
</div>
<div class="panel js-multipages-panel">
    <label for="" class="has-icon">{{__ "Display"}}</label>

    <label>
        <input name="multiPages" type="checkbox" {{#if multiPages}}checked="checked"{{/if}}/>
        <span class="icon-checkbox"></span>
        {{__ "Allow multi pages"}}
    </label>
    <span class="icon-help tooltipstered" data-tooltip="~ .tooltip-content:first" data-tooltip-theme="info"></span>
    <span class="tooltip-content">
        {{__ 'If this box is checked the text reader will allow to display more than one page and to navigate between them.'}}
    </span>
</div>
<div class="panel js-navigation-select-panel">
    <label for="" class="has-icon">{{__ "Navigation"}}</label>
    <span class="icon-help tooltipstered" data-tooltip="~ .tooltip-content:first" data-tooltip-theme="info"></span>
    <div class="tooltip-content">{{__ 'Navigation.'}}</div>
    <select name="navigation" class="select2 js-navigation-select" data-has-search="false">
        <option value="tabs">{{__ 'Tab based'}}</option>
        <option value="buttons">{{__ 'Button based'}}</option>
        <option value="both">{{__ 'Tabs + buttons'}}</option>
    </select>
</div>
<div class="panel js-tab-position-panel">
    <label for="" class="has-icon">{{__ "Tabs position"}}</label>
    <span class="icon-help tooltipstered" data-tooltip="~ .tooltip-content:first" data-tooltip-theme="info"></span>
    <div class="tooltip-content">{{__ 'Tabs position.'}}</div>
    <select name="tabsPosition" class="select2 js-tab-position" data-has-search="false">
        <option value="top">{{__ "Top"}}</option>
        <option value="right">{{__ "Right"}}</option>
        <option value="left">{{__ "Left"}}</option>
        <option value="bottom">{{__ "Bottom"}}</option>
    </select>
</div>
<div class="panel js-button-labels-panel">
    <label for="" class="has-icon">{{__ "Button labels"}}</label>
    <span class="icon-help tooltipstered" data-tooltip="~ .tooltip-content:first" data-tooltip-theme="info"></span>
    <div class="tooltip-content">{{__ 'Button labels.'}}</div>
    <label class="smaller-prompt">
        {{__ 'Previous.'}}
        <input name="buttonLabelsPrev" type="text" value="{{buttonLabels.prev}}">
    </label>
    <label class="smaller-prompt">
        {{__ 'Previous.'}}
        <input name="buttonLabelsNext" type="text" value="{{buttonLabels.next}}">
    </label>
</div>
<div class="tooltip_authoring"></div>