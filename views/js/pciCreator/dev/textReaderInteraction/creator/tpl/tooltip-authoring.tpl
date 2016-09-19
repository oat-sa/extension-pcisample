<h3>Tooltips</h3>
<div class="panel">
    {{#each tooltips}}
    <div>
        <label class="smaller-prompt">
            <a href="#" title="{{__ 'Remove Tooltip'}}">
                <span class="icon-close"></span>
            </a>
            {{label}}
            <textarea name="{{id}}" class="tooltip-content-edit">{{content}}</textarea>
        </label>
    </div>
    {{/each}}
</div>
