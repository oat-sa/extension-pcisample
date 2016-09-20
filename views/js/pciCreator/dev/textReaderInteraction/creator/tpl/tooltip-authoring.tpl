<h3>Tooltips</h3>
<div class="panel">
    {{#each tooltips}}
    <div>
        <label class="smaller-prompt tooltip-edit" data-identifier="{{id}}">
            <a href="#" class="tooltip-delete" title="{{__ 'Remove Tooltip'}}">
                <span class="icon-close"></span>
            </a>
            {{label}}
            <textarea name="{{id}}" class="tooltip-content-edit">{{content}}</textarea>
        </label>
    </div>
    {{/each}}
</div>
